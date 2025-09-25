# Issue-Tracking-System
An issue tracking system made with Python(FastAPI) and ReactJS with TypeScript
This project helps manage issues with statuses, priorities, and assignees.

## Tech Stack
- Frontend: React + TypeScript + Vite  
- Backend: FastAPI (Python)  
- Database: MySQL  

## Installation

### Backend
```bash
cd api
pip install -r requirements.txt
uvicorn main:app --reload
```
### Frontend
```bash
cd frontend/react_frontend
npm install
npm run dev
```
### Database Setup

1. Make sure you have MySQL installed and running.

2. Create a database named issue_tracker_db:
```bash
mysql -u root -p -e "CREATE DATABASE issue_tracker_db;"
```

3. Import the schema + sample data from the provided .sql file:
```bash
mysql -u root -p issue_tracker_db < issue_tracking_database.sql
```

4. Verify that the table was created and data inserted:
```bash
mysql -u root -p -D issue_tracker_db -e "SELECT * FROM issues;"
```
or manually create a database in MySQL Workbench and import and execute issue_tracking_database.sql