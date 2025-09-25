import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE = "http://localhost:8000"

interface Issue{
    id: number;
    title: string;
    issue_description?: string;
    issue_status: string;
    priority: string;
    assignee?: string;
    created_at: string;
    updated_at: string;
}

const Home: React.FC = () => {
    const [error, setError] = useState<string>('');
    const [issues, setIssues] = useState<Issue[]>([]);
    const [searchTitle, setSearchTitle] = useState<string>('');
    const [status, setStatus] = useState<string>('');
    const [priority, setPriority] = useState<string>('');
    const [assignee, setAssignee] = useState<string>('');
    const [assigneesList, setassigneesList] = useState<string[]>([]);
    const [showForm, setShowForm] = useState<boolean>(false);
    const [issueTitle, setIssueTitle] = useState<string>('');
    const [issueDescription, setIssueDescription] = useState<string>('');
    const [issueStatus, setIssueStatus] = useState<string>('');
    const [issuePriority, setIssuePriority] = useState<string>('');
    const [issueAssignee, setIssueAssignee] = useState<string>('');
    const [issueId, setIssueId] = useState<number>();
    const [showEditForm, setShowEditForm] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [issuesPerPage, setIssuesPerPage] = useState(5);
    const [sortBy, setSortBy] = useState<string>('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchIssues();
    }, [searchTitle, status, priority, assignee, sortBy])

    useEffect(() => {
        fetchAssignees();
    }, [])

    const fetchIssues = async () => {
        try {
            const response = await axios.get(`${API_BASE}/issues`, {
                params: {
                    page: 1,
                    pageSize: 1000,
                    sort_by: sortBy || 'id',
                    order: 'asc',
                    search: searchTitle.trim() || undefined,
                    status: status || undefined,
                    priority: priority || undefined,
                    assignee: assignee || undefined
                }
            });
            console.log('Fetched issues:', response.data);
            setIssues(response.data.issues || []);
            setError('');
        } catch (err) {
            setError('Failed to fetch issues');
            console.error('Error fetching issues:', err);
        } 
    };

    const fetchAssignees = async() => {
        try{
            const response = await axios.get(`${API_BASE}/assignees`);
            setassigneesList(response.data.assignees || []);
        }
        catch(err){
            console.error("Error fetching assignees: ", err);
        }
    }
    
    const onFilterChange = () => {
        fetchIssues();
    };

    const handleCreateFormSubmit = async(e:any) =>{
        e.preventDefault();
        try{
            await axios.post(`${API_BASE}/issues`, {
                title: issueTitle,
                issue_description: issueDescription || null,
                issue_status: issueStatus || "open",
                priority: issuePriority || "medium",
                assignee: issueAssignee || null
            }, { headers: { 'Content-Type': 'application/json' }});

            await fetchIssues();
            setShowForm(false);
            setIssueTitle("");
            setIssueDescription("");
            setIssueStatus("");
            setIssuePriority("");
            setIssueAssignee("");
        }
        catch(err){
            console.log('Failed to add new issue: ', err);
        }
    }

    const handleEditFormSubmit = async(e:any) => {
        e.preventDefault();
        try{
            await axios.put(`${API_BASE}/issues/${issueId}`, {
                title: issueTitle,
                issue_description: issueDescription || null,
                issue_status: issueStatus || "open",
                priority: issuePriority || "medium",
                assignee: issueAssignee || null
            }, { headers: { 'Content-Type': 'application/json' }});

            await fetchIssues();
            setShowEditForm(false);
            setIssueTitle("");
            setIssueDescription("");
            setIssueStatus("");
            setIssuePriority("");
            setIssueAssignee("");
        }
        catch(err){}
    }

    const indexOfLastIssue = currentPage * issuesPerPage;
    const indexOfFirstIssue = indexOfLastIssue - issuesPerPage;

    const currentIssues = issues.slice(indexOfFirstIssue, indexOfLastIssue);

    const totalPages = Math.ceil(issues.length / issuesPerPage);

  return (
    <div>
      <h1>Issue Tracking System</h1>
      <div className="filters">
        <input
          type="text"
          placeholder="Search title or description..."
          value={searchTitle}
          onChange={e => {
            setSearchTitle(e.target.value);
            onFilterChange();
          }}
        />

        <select
          value={status}
          onChange={e => {
            setStatus(e.target.value);
            onFilterChange();
          }}
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={priority}
          onChange={e => {
            setPriority(e.target.value);
            onFilterChange();
          }}
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        <select
            value={assignee}
            onChange = {e => {
                setAssignee(e.target.value);
                onFilterChange();
            }}
        >
            <option value="">All Assignees</option>
            {assigneesList.map(a => (
                <option key={a} value={a}>{a}</option>
            ))}
        </select>
        
        <select
            value={issuesPerPage}
            onChange = {e => {
                setIssuesPerPage(Number(e.target.value));
                setCurrentPage(1);
            }}
        >
            <option value = {5}>5</option>
            <option value = {10}>10</option>
            <option value = {20}>20</option>
            <option value = {50}>50</option>
        </select>

        <button onClick={() => setShowForm(true)}>+ Create Issue</button>
        {showForm && 
            <div className='form-container'>
                <h2>Create New Issue</h2>
                <form onSubmit={handleCreateFormSubmit}>
                    <div className='form-group'>
                        <label>Issue title *</label>
                        <input value={issueTitle} onChange={(e) => setIssueTitle(e.target.value)} required/>
                    </div>
                    <div className='form-group'>
                        <label>Issue description </label>
                        <input value={issueDescription} onChange={(e) => setIssueDescription(e.target.value)}/>
                    </div>
                    <div className='form-group'>
                        <label>Issue Status *</label>
                        <select value={issueStatus} onChange={(e) => {setIssueStatus(e.target.value)}} required>
                            <option value="">Select status</option>
                            <option value="open">Open</option>
                            <option value="in-progress">In progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                    <div className='form-group'>
                        <label>Issue Priority *</label>
                        <select value={issuePriority} onChange={(e) => {setIssuePriority(e.target.value)}} required>
                            <option value="">Select priority</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>
                    <div className='form-group'>
                        <label>Assignee</label>
                        <input value={issueAssignee} onChange={(e) => setIssueAssignee(e.target.value)}/>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="cancel-btn" onClick={() => {setShowForm(false)}}>Cancel</button>
                        <button type="submit" className="submit-btn">Submit</button>
                    </div>
                </form>
            </div>
        }
      </div>
      
      {error && <p className='error-msg'>{error}</p>}
      <table>
        <thead>
          <tr>
            <th onClick={
                () => {
                    setSortBy('id');
                }
            } style={{cursor: 'pointer'}}>ID ↓</th>
            <th>Title</th>
            <th onClick={
                ()=>{
                    setSortBy('issue_status');
                }
            } style={{cursor: 'pointer'}}>Status ↓</th>
            <th onClick={
                () => {
                    setSortBy('priority');
                }
            } style={{cursor: 'pointer'}}>Priority ↓</th>
            <th onClick={
                () => {
                    setSortBy('assignee');
                }
            } style={{cursor: 'pointer'}}>Assignee ↓</th>
            <th colSpan={2} style={{color: 'lightgray'}}>↓ meaning sortable</th>
          </tr>
        </thead>
        <tbody>
          {issues.length > 0 ? (
            currentIssues.map(issue => (
              <tr key={issue.id} onClick={() => navigate(`/${issue.id}`)} style={{cursor: 'pointer'}}>
                <td>{issue.id}</td>
                <td>{issue.title}</td>
                <td>{issue.issue_status}</td>
                <td>{issue.priority}</td>
                <td>{issue.assignee || '-'}</td>
                <td onClick={(e) => e.stopPropagation()}>
                    <button
                    onClick={() => {
                        setShowEditForm(true);
                        setIssueId(issue.id);
                        setIssueTitle(issue.title);
                        setIssueDescription(issue.issue_description || "");
                        setIssueStatus(issue.issue_status);
                        setIssuePriority(issue.priority);
                        setIssueAssignee(issue.assignee || "");
                    }}
                    >
                    Edit
                    </button>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                    <Link to={`/${issue.id}`}>
                        <button>View</button>
                    </Link>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="emptyIssueTable" colSpan={7}>No issues found</td>
            </tr>
          )}
        </tbody>
      </table>
      <div className = "pagination">
        <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
            Prev
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={() => setCurrentPage((prev) => Math.min(prev+1, totalPages))} disabled={currentPage === totalPages}>
            Next
        </button>
      </div>
      <div className='pagination-numbers'>
        {Array.from({length: totalPages}, (_, i)=>(
            <button key={i} className={currentPage === i + 1? "active": ""} onClick={() => setCurrentPage(i+1)}>
                {i + 1}
            </button>
        ))}
      </div>
      {showEditForm && 
        <div className='form-container'>
            <h2>Edit Issue</h2>
            <form onSubmit={handleEditFormSubmit}>
                <div className='form-group'>
                    <label>Issue title *</label>
                    <input value={issueTitle} onChange={(e) => setIssueTitle(e.target.value)} required/>
                </div>
                <div className='form-group'>
                    <label>Issue description</label>
                    <input value={issueDescription} onChange={(e) => setIssueDescription(e.target.value)}/>
                </div>
                <div className='form-group'>
                    <label>Issue Status *</label>
                    <select value={issueStatus} onChange={(e) => {setIssueStatus(e.target.value)}} required>
                        <option value="">Select status</option>
                        <option value="open">Open</option>
                        <option value="in-progress">In progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>
                <div className='form-group'>
                    <label>Issue Priority *</label>
                        <select value={issuePriority} onChange={(e) => {setIssuePriority(e.target.value)}} required>
                        <option value="">Select priority</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                    </select>
                </div>
                <div className='form-group'>
                    <label>Assignee</label>
                    <input value={issueAssignee} onChange={(e) => setIssueAssignee(e.target.value)}/>
                </div>
                <div className="form-actions">
                    <button type="button" className="cancel-btn" onClick={() => {
                        setShowEditForm(false);
                        setIssueId(undefined);
                        setIssueTitle("");
                        setIssueDescription("");
                        setIssueStatus("");
                        setIssuePriority("");
                        setIssueAssignee("");
                        }}
                    >Cancel</button>
                    <button type="submit" className="submit-btn">Submit</button>
                </div>
            </form>
        </div>
      }
    </div>
  )
}

export default Home