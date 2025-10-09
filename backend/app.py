from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import PyPDF2, tempfile, re, os, logging, unicodedata
from PyPDF2.errors import PdfReadError
from transformers import pipeline
from typing import List, Dict, Tuple
import pandas as pd
from collections import Counter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="eConsultation Backend", version="2.0")

# Allow requests from your frontend (Streamlit on port 8501).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load HF model if available (fallback rule-based exists)
sentiment_analyzer = None
try:
    sentiment_analyzer = pipeline(
        "sentiment-analysis",
        model="distilbert/distilbert-base-uncased-finetuned-sst-2-english"
    )
    logger.info("Loaded HuggingFace sentiment model.")
except Exception as e:
    sentiment_analyzer = None
    logger.warning("Could not load HF sentiment model; will use fallback classifier. Error: %s", e)

# ---------------------------
# Stopwords / token helpers
# ---------------------------
STOPWORDS_EN = {
    "the","and","is","this","that","it","as","are","a","an","of","to","for","in","on","be",
    "with","by","or","from","at","was","were","will","would","can","should","not","but",
    "has","have","i","we","you","they","their","our","your","so","if","or","too","may",
    "also","these","those","such","each","per","per","each","all","any","more","most","some","coc"
}
# small Hindi stopword set; extend when you see other common connectors
STOPWORDS_HI = {"aur","और","hai","है","ke","का","की","को","ye","ये","yeh","यह","ka","के","mein","में","par","पर","se","से","ho","हो","ya","या","hai","हैं"}

ALL_STOPWORDS = set(w.lower() for w in STOPWORDS_EN) | set(w.lower() for w in STOPWORDS_HI)

def normalize_text(s: str) -> str:
    s = unicodedata.normalize("NFKC", s)
    s = "".join(ch for ch in s if unicodedata.category(ch)[0] != "C")  # drop control chars
    return s.strip()

def tokenize_and_filter(text: str) -> List[str]:
    """Return cleaned tokens: lowercased, stopwords removed, length>2, not numeric."""
    if not text:
        return []
    text = normalize_text(text).lower()
    # keep word characters; this works with devanagari and latin in many environments
    tokens = re.findall(r"[\w']+", text, flags=re.UNICODE)
    tokens = [t for t in tokens if (not t.isnumeric()) and (len(t) > 2) and (t not in ALL_STOPWORDS)]
    return tokens

def extract_keyword_freqs(comments: List[str], top_k: int = 150) -> Dict[str, int]:
    """Return top_k keyword frequencies aggregated across comments (filtered)."""
    c = Counter()
    for com in comments:
        toks = tokenize_and_filter(com)
        c.update(toks)
    if not c:
        return {}
    if top_k:
        return dict(c.most_common(top_k))
    return dict(c)

# ---------------------------
# existing text extraction + parsing (unchanged)
# ---------------------------
def extract_text_from_pdf(path: str) -> str:
    try:
        reader = PyPDF2.PdfReader(path)
    except PdfReadError:
        try:
            reader = PyPDF2.PdfReader(path, strict=False)
        except Exception:
            raise ValueError("Could not read PDF: file appears truncated or is not a valid PDF.")
    text_parts = []
    for page in reader.pages:
        content = page.extract_text()
        if content:
            text_parts.append(content)
    return "\n".join(text_parts)

def parse_sections(text: str) -> List[Dict]:
    norm = re.sub(r'\r\n', '\n', text)
    split_parts = re.split(r'(Part\s+\d+:)', norm)
    if len(split_parts) <= 1:
        return [{"title": "Full Document", "content": norm}]
    it = iter(split_parts)
    _ = next(it)
    return [{"title": marker.strip(), "content": next(it, "").strip()} for marker in it]

def extract_bullets_and_counts(content: str) -> Dict:
    counts = {}
    fav_match = re.search(r'Comments in favour[^:\n]*:\s*([0-9]+)', content, flags=re.IGNORECASE)
    ag_match = re.search(r'Comments against[^:\n]*:\s*([0-9]+)', content, flags=re.IGNORECASE)
    if fav_match: counts['in_favour'] = int(fav_match.group(1))
    if ag_match: counts['against'] = int(ag_match.group(1))
    bullets = re.findall(r'(^\s*[•\-\u2022]\s+.+)$', content, flags=re.MULTILINE)
    bullets = [b.strip(" \n\t•-") for b in bullets]
    return {"counts": counts, "bullets": bullets}

def aggregate_analysis(parts: List[Dict]) -> Dict:
    total_fav, total_ag = 0, 0
    parsed_parts, all_comments = [], []
    for p in parts:
        parsed = extract_bullets_and_counts(p["content"])
        in_fav = parsed["counts"].get("in_favour", 0)
        ag = parsed["counts"].get("against", 0)
        total_fav += in_fav
        total_ag += ag
        all_comments.extend(parsed["bullets"])
        parsed_parts.append({
            "title": p.get("title", "Section"),
            "in_favour": in_fav,
            "against": ag,
            "bullets": parsed["bullets"]
        })
    return {
        "parts": parsed_parts,
        "total_in_favour": total_fav,
        "total_against": total_ag,
        "all_comments": all_comments
    }

# ---------------------------
# sentiment analysis (returns lists + keyword freqs)
# ---------------------------
def run_sentiment_analysis(comments: List[str]) -> Dict:
    if not comments:
        return {"counts": {}, "positive": [], "negative": [], "neutral": [], "keyword_freqs": {"positive": {}, "negative": {}, "neutral": {}}}

    # classify comments (HF or fallback)
    pos, neg, neu = [], [], []
    try:
        if sentiment_analyzer is not None:
            results = sentiment_analyzer(comments)
            for c, r in zip(comments, results):
                lab = r.get("label", "").lower()
                if "pos" in lab:
                    pos.append(c)
                elif "neg" in lab:
                    neg.append(c)
                else:
                    neu.append(c)
        else:
            # fallback simple keyword rules
            for c in comments:
                lc = c.lower()
                if any(tok in lc for tok in ["good", "support", "welcome", "positive", "agree", "strongly support", "benefit", "help"]):
                    pos.append(c)
                elif any(tok in lc for tok in ["not", "no", "oppose", "against", "concern", "problem", "unfair", "cost", "costly", "negative"]):
                    neg.append(c)
                else:
                    neu.append(c)
    except Exception as e:
        logger.warning("Sentiment pipeline error: %s. Falling back to simple rules.", e)
        for c in comments:
            lc = c.lower()
            if any(tok in lc for tok in ["good", "support", "welcome", "positive", "agree"]):
                pos.append(c)
            elif any(tok in lc for tok in ["not", "no", "oppose", "against", "concern"]):
                neg.append(c)
            else:
                neu.append(c)

    counts = {"positive": len(pos), "negative": len(neg), "neutral": len(neu)}

    # extract keyword freqs per sentiment (backend removes stopwords)
    pos_freq = extract_keyword_freqs(pos, top_k=150)
    neg_freq = extract_keyword_freqs(neg, top_k=150)
    neu_freq = extract_keyword_freqs(neu, top_k=150)

    return {
        "counts": counts,
        "positive": pos,
        "negative": neg,
        "neutral": neu,
        "keyword_freqs": {"positive": pos_freq, "negative": neg_freq, "neutral": neu_freq}
    }

# ---------------------------
# MISSING FUNCTIONS - Now Implemented
# ---------------------------
def generate_summary(analysis: Dict) -> str:
    """Generate a summary of the analysis results."""
    total_comments = len(analysis["all_comments"])
    total_fav = analysis["total_in_favour"]
    total_ag = analysis["total_against"]
    num_sections = len(analysis["parts"])
    
    if total_comments == 0:
        return "No comments found in the uploaded file."
    
    summary_parts = [
        f"Analysis of {total_comments} stakeholder comments across {num_sections} section(s)."
    ]
    
    if total_fav > 0 or total_ag > 0:
        total_with_stance = total_fav + total_ag
        if total_with_stance > 0:
            fav_percentage = (total_fav / total_with_stance) * 100
            ag_percentage = (total_ag / total_with_stance) * 100
            summary_parts.append(
                f"Sentiment breakdown: {total_fav} in favour ({fav_percentage:.1f}%), "
                f"{total_ag} against ({ag_percentage:.1f}%)."
            )
        else:
            summary_parts.append(f"{total_fav} comments in favour, {total_ag} against.")
    
    # Add section-wise breakdown if multiple sections
    if num_sections > 1:
        section_summaries = []
        for part in analysis["parts"]:
            section_summaries.append(
                f"{part['title']}: {len(part['bullets'])} comments "
                f"({part['in_favour']} in favour, {part['against']} against)"
            )
        summary_parts.append("Section breakdown: " + "; ".join(section_summaries))
    
    return " ".join(summary_parts)

def decide_pass_modify(analysis: Dict) -> Tuple[str, str]:
    """Decide whether to pass or modify based on analysis, return decision and rationale."""
    total_fav = analysis["total_in_favour"]
    total_ag = analysis["total_against"]
    total_comments = len(analysis["all_comments"])
    
    if total_comments == 0:
        return "INSUFFICIENT_DATA", "No stakeholder comments available for decision-making."
    
    # If we have explicit favour/against counts
    if total_fav > 0 or total_ag > 0:
        total_with_stance = total_fav + total_ag
        if total_with_stance > 0:
            support_ratio = total_fav / total_with_stance
            
            if support_ratio >= 0.7:  # 70% or more support
                decision = "PASS"
                rationale = f"Strong stakeholder support with {total_fav} in favour vs {total_ag} against ({support_ratio:.1%} support rate)."
            elif support_ratio >= 0.5:  # 50-70% support
                decision = "PASS_WITH_MODIFICATIONS"
                rationale = f"Moderate stakeholder support with {total_fav} in favour vs {total_ag} against ({support_ratio:.1%} support rate). Consider addressing concerns raised."
            else:  # Less than 50% support
                decision = "MODIFY"
                rationale = f"Limited stakeholder support with {total_fav} in favour vs {total_ag} against ({support_ratio:.1%} support rate). Significant modifications recommended."
        else:
            decision = "REVIEW_REQUIRED"
            rationale = "Unable to determine stakeholder sentiment from available comments."
    else:
        # Fallback when no explicit counts available
        decision = "REVIEW_REQUIRED"
        rationale = f"Manual review recommended for {total_comments} stakeholder comments to determine overall sentiment."
    
    return decision, rationale

def suggest_changes() -> List[str]:
    """Suggest generic policy changes based on common feedback patterns."""
    return [
        "Consider stakeholder feedback on implementation timelines and provide more detailed transition periods",
        "Review cost implications mentioned in opposition comments and assess impact mitigation measures",
        "Clarify ambiguous language or definitions that generated questions or concerns",
        "Evaluate suggestions for alternative approaches or modifications proposed by stakeholders",
        "Consider pilot programs or phased implementation for contentious provisions",
        "Review enforcement mechanisms and penalties based on stakeholder input",
        "Address compliance burden concerns raised by affected parties",
        "Consider additional exemptions or special provisions for specific sectors or circumstances"
    ]

# ---------- API Route ----------
@app.post("/analyze")
async def analyze_file(file: UploadFile = File(...)):
    filename = getattr(file, "filename", None) or "uploaded_file"
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    suffix = f".{ext}" if ext else ".bin"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        parts = []
        if ext == "pdf":
            text = extract_text_from_pdf(tmp_path)
            parts = parse_sections(text)
        elif ext == "csv":
            df = None
            parse_error = None
            for try_header in [0, None]:
                try:
                    df = pd.read_csv(tmp_path, header=try_header, engine="python", encoding="utf-8")
                    break
                except Exception as e:
                    parse_error = e
            if df is None:
                try:
                    df = pd.read_csv(tmp_path, header=0, engine="python", encoding="utf-8-sig")
                except Exception as e:
                    raise ValueError(f"Could not parse CSV: {parse_error} / {e}")
            if df.shape[1] == 0:
                raise ValueError("CSV appears empty.")
            candidate_names = [c.lower() for c in df.columns.astype(str)]
            comment_col = None
            for name in ["comment", "comments", "text", "response", "feedback", "remark"]:
                if name in candidate_names:
                    comment_col = df.columns[candidate_names.index(name)]
                    break
            if comment_col is None:
                comment_col = df.columns[0]
            comments = df[comment_col].dropna().astype(str).tolist()
            bullet_lines = ["• " + c.replace("\n", " ") for c in comments if str(c).strip() != ""]
            parts = [{"title": "CSV Comments", "content": "\n".join(bullet_lines)}]
        else:
            return JSONResponse(status_code=400, content={"error": "Unsupported file format. Please upload a PDF or CSV."})

        analysis = aggregate_analysis(parts)
        sentiments = run_sentiment_analysis(analysis["all_comments"])

        inferred_from_sentiment = False
        if analysis["total_in_favour"] == 0 and analysis["total_against"] == 0:
            sc = sentiments.get("counts", {})
            pos_cnt = sc.get("positive", 0)
            neg_cnt = sc.get("negative", 0)
            if (pos_cnt + neg_cnt + sc.get("neutral", 0)) > 0:
                analysis["total_in_favour"] = pos_cnt
                analysis["total_against"] = neg_cnt
                inferred_from_sentiment = True

        summary = generate_summary(analysis)
        decision, rationale = decide_pass_modify(analysis)
        changes = suggest_changes()
        total_comments = len(analysis["all_comments"])

        result = {
            "summary": summary,
            "decision": decision,
            "rationale": rationale,
            "suggested_changes": changes,
            "sections": analysis["parts"],
            "sentiments": sentiments,
            "total_comments": total_comments,
            "inferred_from_sentiment": inferred_from_sentiment,
            "total_in_favour": analysis["total_in_favour"],
            "total_against": analysis["total_against"],
        }
        return JSONResponse(content=result)
    except ValueError as e:
        return JSONResponse(status_code=400, content={"error": str(e)})
    except Exception as e:
        logger.error(f"Unexpected error during file analysis: {str(e)}", exc_info=True)
        return JSONResponse(status_code=500, content={"error": f"Internal server error: {str(e)}"})
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": sentiment_analyzer is not None}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)