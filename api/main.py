from fastapi import FastAPI, Query, Form, HTTPException
from pydantic import BaseModel
import mysql.connector
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

db_config = {
    "host": "localhost",
    "user": "root",
    "password": "root",
    "database": "issue_tracker_db"
}


def get_db():
    conn = mysql.connector.connect(**db_config)
    return conn

#Models
class IssueCreate(BaseModel):
    title: str
    issue_description: Optional[str] = None
    issue_status: Optional[str] = "open"
    priority: Optional[str] = "medium"
    assignee: Optional[str] = None

class IssueUpdate(BaseModel):
    title: Optional[str] = None
    issue_description: Optional[str] = None
    issue_status: Optional[str] = None
    priority: Optional[str] = None
    assignee: Optional[str] = None

#Endpoints

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/issues")
def get_issues(
    search: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assignee: Optional[str] = None,
    sort_by: str = "created_at",
    order: str = "desc",
    page: int = 1,
    pageSize: int = 10
):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    # First, get the total count (without LIMIT/OFFSET)
    count_query = "SELECT COUNT(*) as total FROM issues WHERE 1=1"
    count_params = []

    # Apply the same filters to count query - FIXED: check for None/empty
    if status and status.strip():  # Check for non-empty string
        count_query += " AND issue_status = %s"
        count_params.append(status)
    
    if priority and priority.strip():  # Check for non-empty string
        count_query += " AND priority = %s"
        count_params.append(priority)

    if assignee and assignee.strip():  # Check for non-empty string
        count_query += " AND assignee = %s"
        count_params.append(assignee)

    if search and search.strip():  # Check for non-empty string
        count_query += " AND MATCH(title, issue_description) AGAINST (%s IN NATURAL LANGUAGE MODE)"
        count_params.append(search)

    cursor.execute(count_query, tuple(count_params))
    total_count = cursor.fetchone()['total']

    # Now get the paginated results
    query = "SELECT * FROM issues WHERE 1=1"
    params = []

    # Filter (same as count query) - FIXED: check for None/empty
    if status and status.strip():
        query += " AND issue_status = %s"
        params.append(status)
    
    if priority and priority.strip():
        query += " AND priority = %s"
        params.append(priority)

    if assignee and assignee.strip():
        query += " AND assignee = %s"
        params.append(assignee)

    # Searching
    if search and search.strip():
        query += " AND MATCH(title, issue_description) AGAINST (%s IN NATURAL LANGUAGE MODE)"
        params.append(search.strip())

    # Sorting
    if sort_by not in ["id", "issue_status", "priority", "assignee", "created_at", "updated_at"]:
        sort_by = "created_at"
    if order.lower() not in ["asc", "desc"]:
        order = "asc"
    query += f" ORDER BY {sort_by} {order.upper()}"

    # Pagination
    offset = (page - 1) * pageSize
    query += " LIMIT %s OFFSET %s"
    params.extend([pageSize, offset])

    # Execute the paginated query
    cursor.execute(query, tuple(params))
    issues = cursor.fetchall()

    cursor.close()
    conn.close()

    return {
        "page": page, 
        "pageSize": pageSize, 
        "totalCount": total_count,
        "issues": issues
    }

#Returning a single issue
@app.get("/issues/{issue_id}")
def get_single_issue(issue_id: int):
    conn = get_db()
    cursor = conn.cursor(dictionary = True)

    cursor.execute("SELECT * FROM issues WHERE id = %s", (issue_id,))
    issue = cursor.fetchone()

    cursor.close()
    conn.close()

    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    return issue

#Creating a new issue
@app.post("/issues")
def create_new_issue(issue: IssueCreate):
    conn = get_db()
    cursor = conn.cursor(dictionary = True)

    cursor.execute("INSERT INTO issues (title, issue_description, issue_status, priority, assignee) VALUES (%s, %s, %s, %s, %s)", (issue.title, issue.issue_description, issue.issue_status, issue.priority, issue.assignee))

    conn.commit()

    issue_id = cursor.lastrowid

    cursor.execute("SELECT * FROM issues WHERE id = %s", (issue_id,))
    new_issue = cursor.fetchone()

    cursor.close()
    conn.close()

    return new_issue

#Updating an existing issue
@app.put("/issues/{issue_id}")
def update_existing_issue(issue_id: int, issue: IssueUpdate):
    conn = get_db()
    cursor = conn.cursor(dictionary = True)

    fields = []
    values = []

    for field, value in issue.dict(exclude_unset=True).items():
        fields.append(f"{field} = %s")
        values.append(value)

    if not fields:
        raise HTTPException(status_code=400, detail="No fields provided for updation")
    
    query = f"UPDATE issues SET {', '.join(fields)}, updated_at = CURRENT_TIMESTAMP WHERE id = %s"
    values.append(issue_id)
    
    cursor.execute(query, tuple(values))

    conn.commit()

    cursor.execute("SELECT * FROM issues WHERE id = %s", (issue_id,))
    updated_issue = cursor.fetchone()

    cursor.close()
    conn.close()

    if not updated_issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    return updated_issue

@app.get("/assignees")
def get_assignees():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT assignee FROM issues WHERE assignee IS NOT NULL")
    assignees = [row[0] for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    return {"assignees": assignees}