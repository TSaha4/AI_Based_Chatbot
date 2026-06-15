from fastapi import FastAPI

app = FastAPI(title="AI Chatbot Backend", version="1.0.0")


@app.get("/")
def read_root():
    return {"message": "FastAPI backend is ready"}
