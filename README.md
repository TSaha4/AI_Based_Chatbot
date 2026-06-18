# AI Chatbot Backend

## Database

Database Name:

ai_chatbot_db

## Collections

* admins
* tickets
* knowledge_chunks
* admin_resolutions
* response_cache
* query_analytics
* topic_aliases
* system_logs

## Setup

Install dependencies:

pip install -r requirements.txt

Create .env:

MONGODB_URI=your_connection_string

Run:

python setup_db.py

Create indexes:

python create_indexes.py
