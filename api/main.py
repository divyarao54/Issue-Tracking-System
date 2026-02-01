from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel
import mysql.connector
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from datetime import date
from enum import Enum
from fastapi import Depends
from typing import List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# =========================
# Database Configuration
# =========================
db_config = {
    "host": "localhost",
    "user": "root",
    "password": "root",
    "database": "issue_tracker_db"
}

def get_db():
    return mysql.connector.connect(**db_config)

# =========================
# Models
# =========================
class IssueStatus(str, Enum):
    open = "open"
    closed = "closed"
    in_progress = "in-progress"
    resolved = "resolved"
    verified = "verified"

class Issue(BaseModel):
    title: str
    issue_description: Optional[str] = None
    issue_status: Optional[IssueStatus] = None
    priority: str = None
    assignee_id: Optional[int] = None
    verified_by: Optional[int] = None

# Create a separate model for query parameters
class IssueQueryParams(BaseModel):
    search: Optional[str] = None
    issue_status: Optional[IssueStatus] = None
    priority: Optional[str] = None
    assignee_name: Optional[str] = None
    sort_by: Optional[str] = "created_at"
    order: Optional[str] = "desc"
    page: Optional[int] = 1
    pageSize: Optional[int] = 10

# =========================
# Utility Functions
# =========================
def find_available_assignee(cursor):
    cursor.execute(
        """
        SELECT a.id
        FROM assignees a
        LEFT JOIN issues i
          ON a.id = i.assignee_id
         AND i.assigned_date = CURDATE()
        WHERE i.id IS NULL
        LIMIT 1
        """
    )
    row = cursor.fetchone()
    return row["id"] if row else None

# =========================
# Health Check
# =========================
@app.get("/health")
def health():
    return {"status": "ok"}

# =========================
# Issues Endpoints
# =========================
@app.get("/issues")
def get_issues(query: IssueQueryParams = Depends()):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    base_query = """
        FROM issues i
        LEFT JOIN assignees a ON i.assignee_id = a.id
        LEFT JOIN assignees v ON i.verified_by = v.id
        WHERE 1=1
    """

    filters = []
    params = []

    # ---- Filters ----
    if query.issue_status:
        filters.append("i.issue_status = %s")
        params.append(query.issue_status.value)

    if query.priority:
        filters.append("i.priority = %s")
        params.append(query.priority)

    if query.assignee_name:
        filters.append("a.assignee_name = %s")
        params.append(query.assignee_name)

    if query.search:
        filters.append(
            "(i.title LIKE %s OR i.issue_description LIKE %s)"
        )
        params.extend([f"%{query.search}%", f"%{query.search}%"])

    if filters:
        base_query += " AND " + " AND ".join(filters)

    # ---- Count ----
    cursor.execute(f"SELECT COUNT(*) AS total {base_query}", params)
    total_count = cursor.fetchone()["total"]

    # ---- Sorting ----
    allowed_sort_fields = {
        "id", "issue_status", "priority", "created_at", "updated_at", "title"
    }

    sort_by = query.sort_by if query.sort_by in allowed_sort_fields else "created_at"
    order = query.order.lower() if query.order.lower() in {"asc", "desc"} else "desc"

    offset = (query.page - 1) * query.pageSize

    # ---- Data ----
    cursor.execute(
        f"""
        SELECT 
            i.*, 
            a.assignee_name,
            v.assignee_name as verified_by_name
        {base_query}
        ORDER BY i.{sort_by} {order.upper()}
        LIMIT %s OFFSET %s
        """,
        params + [query.pageSize, offset]
    )

    issues = cursor.fetchall()
    cursor.close()
    conn.close()

    return {
        "page": query.page,
        "pageSize": query.pageSize,
        "totalCount": total_count,
        "issues": issues
    }

@app.get("/issues/{issue_id}")
def get_single_issue(issue_id: int):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT 
            i.*, 
            a.assignee_name,
            v.assignee_name as verified_by_name
        FROM issues i
        LEFT JOIN assignees a ON i.assignee_id = a.id
        LEFT JOIN assignees v ON i.verified_by = v.id
        WHERE i.id = %s
        """,
        (issue_id,)
    )

    issue = cursor.fetchone()
    cursor.close()
    conn.close()

    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    return issue

@app.post("/issues")
def create_new_issue(issue: Issue):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    assignee_id = issue.assignee_id

    if assignee_id is None:
        assignee_id = find_available_assignee(cursor)

    if assignee_id is not None:
        cursor.execute(
            """
            SELECT COUNT(*) AS cnt
            FROM issues
            WHERE assignee_id = %s AND assigned_date = CURDATE()
            """,
            (assignee_id,)
        )
        if cursor.fetchone()["cnt"] > 0:
            raise HTTPException(status_code=400, detail="Assignee already assigned today")

    cursor.execute(
        """
        INSERT INTO issues
        (title, issue_description, issue_status, priority, assignee_id, assigned_date)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (
            issue.title,
            issue.issue_description,
            issue.issue_status,
            issue.priority,
            assignee_id,
            date.today() if assignee_id else None
        )
    )

    conn.commit()
    issue_id = cursor.lastrowid

    cursor.execute(
        """
        SELECT 
            i.*, 
            a.assignee_name,
            v.assignee_name as verified_by_name
        FROM issues i
        LEFT JOIN assignees a ON i.assignee_id = a.id
        LEFT JOIN assignees v ON i.verified_by = v.id
        WHERE i.id = %s
        """,
        (issue_id,)
    )

    new_issue = cursor.fetchone()
    cursor.close()
    conn.close()

    return new_issue

@app.put("/issues/{issue_id}")
def update_existing_issue(issue_id: int, issue: Issue):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    fields = []
    values = []

    data = issue.dict(exclude_unset=True)

    if "assignee_id" in data:
        if data["assignee_id"] is None:
            data["assignee_id"] = find_available_assignee(cursor)

        if data["assignee_id"] is not None:
            cursor.execute(
                """
                SELECT COUNT(*) AS cnt
                FROM issues
                WHERE assignee_id = %s AND assigned_date = CURDATE() AND id != %s
                """,
                (data["assignee_id"], issue_id)
            )
            if cursor.fetchone()["cnt"] > 0:
                raise HTTPException(status_code=400, detail="Assignee already assigned today")

        fields.append("assignee_id = %s")
        fields.append("assigned_date = %s")
        values.extend([data["assignee_id"], date.today() if data["assignee_id"] else None])
        data.pop("assignee_id")

    for field, value in data.items():
        fields.append(f"{field} = %s")
        values.append(value)

    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    query = f"""
        UPDATE issues
        SET {', '.join(fields)}, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
    """

    values.append(issue_id)
    cursor.execute(query, values)
    conn.commit()

    cursor.execute(
        """
        SELECT 
            i.*, 
            a.assignee_name,
            v.assignee_name as verified_by_name
        FROM issues i
        LEFT JOIN assignees a ON i.assignee_id = a.id
        LEFT JOIN assignees v ON i.verified_by = v.id
        WHERE i.id = %s
        """,
        (issue_id,)
    )

    updated_issue = cursor.fetchone()
    cursor.close()
    conn.close()

    return updated_issue

@app.post("/issues/{issue_id}/verify")
def verify_issue(issue_id: int, verifier_id: int = Query(...)):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    # Check issue exists
    cursor.execute("SELECT id FROM issues WHERE id = %s", (issue_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Issue not found")

    # Check verifier exists
    cursor.execute("SELECT id, assignee_name FROM assignees WHERE id = %s", (verifier_id,))
    verifier = cursor.fetchone()
    if not verifier:
        raise HTTPException(status_code=404, detail="Verifier not found")

    # Mark issue as verified
    cursor.execute(
        """
        UPDATE issues
        SET issue_status = 'verified',
            verified_by = %s,
            verified_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
        """,
        (verifier_id, issue_id)
    )

    conn.commit()

    cursor.execute(
        """
        SELECT 
            i.*, 
            a.assignee_name,
            v.assignee_name as verified_by_name
        FROM issues i
        LEFT JOIN assignees a ON i.assignee_id = a.id
        LEFT JOIN assignees v ON i.verified_by = v.id
        WHERE i.id = %s
        """,
        (issue_id,)
    )

    verified_issue = cursor.fetchone()
    cursor.close()
    conn.close()

    return verified_issue