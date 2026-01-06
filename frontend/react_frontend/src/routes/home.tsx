import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import EditIcon from '../assets/edit_icon.svg?react';
import InfoIcon from '../assets/info_icon.svg?react';

const API_BASE = "http://localhost:8000";

interface Assignee {
  id: number;
  assignee_name: string;
}

interface Issue {
  id: number;
  title: string;
  issue_description?: string;
  issue_status: string;
  priority: string;
  assignee_id?: number | null;
  assignee_name?: string | null;
  assigned_date?: string | null;
  verified_by?: number | null;
  verified_by_name?: string | null;  // Add this field
  verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface IssuesResponse {
  page: number;
  pageSize: number;
  totalCount: number;
  issues: Issue[];
}

const Home: React.FC = () => {
  const navigate = useNavigate();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [availableAssignees, setAvailableAssignees] = useState<Assignee[]>([]);

  const [search, setSearch] = useState('');
  const [issue_status, setIssueStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [assignee_name, setAssigneeName] = useState('');

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const [issueId, setIssueId] = useState<number | null>(null);
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueStatusField, setIssueStatusField] = useState('open');
  const [issuePriority, setIssuePriority] = useState('medium');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<number | null>(null);
  const [markVerified, setMarkVerified] = useState(false);
  const [verifierId, setVerifierId] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sort_by, setSortBy] = useState('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  /* ---------------- Fetch Data ---------------- */

  const fetchIssues = async () => {
    try {
      const params = {
        search: search || undefined,
        issue_status: issue_status || undefined,
        priority: priority || undefined,
        assignee_name: assignee_name || undefined,
        sort_by: sort_by,
        order: order,
        page: currentPage,
        pageSize: pageSize
      };

      // Clean params
      const cleanParams: Record<string, any> = {};
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          cleanParams[key] = value;
        }
      }

      console.log('Fetching issues with params:', cleanParams);
      
      const res = await axios.get<IssuesResponse>(`${API_BASE}/issues`, {
        params: cleanParams
      });
      
      setIssues(res.data.issues || []);
      setTotalCount(res.data.totalCount || 0);
      setTotalPages(Math.ceil((res.data.totalCount || 0) / pageSize));
    } catch (error) {
      console.error('Error fetching issues:', error);
      if (axios.isAxiosError(error)) {
        console.error('Error response:', error.response?.data);
      }
    }
  };

  const fetchAllAssignees = async () => {
    try {
      const res = await axios.get(`${API_BASE}/assignees`);
      setAssignees(res.data.assignees || []);
    } catch (error) {
      console.error('Error fetching assignees:', error);
    }
  };

  const fetchAvailableAssignees = async () => {
    try {
      const res = await axios.get(`${API_BASE}/assignees/available`);
      setAvailableAssignees(res.data.assignees || []);
    } catch (error) {
      console.error('Error fetching available assignees:', error);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [search, issue_status, priority, assignee_name, sort_by, order, currentPage, pageSize]);

  useEffect(() => {
    fetchAllAssignees();
    fetchAvailableAssignees();
  }, []);

  /* ---------------- Create Issue ---------------- */

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const issueData: any = {
        title: issueTitle,
        issue_description: issueDescription || null,
        issue_status: issueStatusField,
        priority: issuePriority,
        assignee_id: selectedAssigneeId
      };

      // If creating with verified status, we need to use the verify endpoint
      if (issueStatusField === 'verified' && verifierId) {
        // First create the issue
        const createRes = await axios.post(`${API_BASE}/issues`, {
          ...issueData,
          issue_status: 'resolved' // Create as resolved first
        });
        
        const newIssueId = createRes.data.id;
        
        // Then verify it
        await axios.post(`${API_BASE}/issues/${newIssueId}/verify`, {}, {
          params: { verifier_id: verifierId }
        });
      } else {
        // Regular create
        await axios.post(`${API_BASE}/issues`, issueData);
      }

      setShowCreateForm(false);
      resetCreateForm();
      fetchIssues();
      fetchAvailableAssignees();
    } catch (error) {
      console.error('Error creating issue:', error);
      alert('Error creating issue. Please check console for details.');
    }
  };

  const resetCreateForm = () => {
    setIssueTitle('');
    setIssueDescription('');
    setIssueStatusField('open');
    setIssuePriority('medium');
    setSelectedAssigneeId(null);
    setMarkVerified(false);
    setVerifierId(null);
  };

  /* ---------------- Edit Issue ---------------- */

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const updateData: any = {
        title: issueTitle,
        issue_description: issueDescription || null,
        issue_status: issueStatusField,
        priority: issuePriority,
        assignee_id: selectedAssigneeId
      };

      // If changing status to verified and verifier is selected
      if (issueStatusField === 'verified') {
        if (verifierId) {
          // Use the verify endpoint for verification
          await axios.post(`${API_BASE}/issues/${issueId}/verify`, {}, {
            params: { verifier_id: verifierId }
          });
        } else {
          throw new Error('Verifier is required when marking as verified');
        }
      } else {
        // Regular update
        await axios.put(`${API_BASE}/issues/${issueId}`, updateData);
      }

      setShowEditForm(false);
      resetEditForm();
      fetchIssues();
      fetchAvailableAssignees();
    } catch (error) {
      console.error('Error updating issue:', error);
      alert('Error updating issue. Please check console for details.');
    }
  };

  const resetEditForm = () => {
    setIssueId(null);
    setIssueTitle('');
    setIssueDescription('');
    setIssueStatusField('open');
    setIssuePriority('medium');
    setSelectedAssigneeId(null);
    setMarkVerified(false);
    setVerifierId(null);
  };

  const openEditForm = (issue: Issue) => {
    setShowEditForm(true);
    setIssueId(issue.id);
    setIssueTitle(issue.title);
    setIssueDescription(issue.issue_description || '');
    setIssueStatusField(issue.issue_status);
    setIssuePriority(issue.priority);
    setSelectedAssigneeId(issue.assignee_id || null);
    setMarkVerified(issue.issue_status === "verified");
    setVerifierId(issue.verified_by || null);
  };

  /* ---------------- Pagination ---------------- */

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div style={{ padding: '20px' }}>
      <h1>Issue Tracking System</h1>

      {/* Filters */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input
          placeholder="Search titles and descriptions..."
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setCurrentPage(1); // Reset to first page on search
          }}
          style={{ padding: '8px', width: '200px' }}
        />

        <select 
          value={issue_status} 
          onChange={e => {
            setIssueStatus(e.target.value);
            setCurrentPage(1);
          }}
          style={{ padding: '8px' }}
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="verified">Verified</option>
          <option value="closed">Closed</option>
        </select>

        <select 
          value={priority} 
          onChange={e => {
            setPriority(e.target.value);
            setCurrentPage(1);
          }}
          style={{ padding: '8px' }}
        >
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        <select 
          value={assignee_name} 
          onChange={e => {
            setAssigneeName(e.target.value);
            setCurrentPage(1);
          }}
          style={{ padding: '8px' }}
        >
          <option value="">All Assignees</option>
          {assignees.map(a => (
            <option key={a.id} value={a.assignee_name}>
              {a.assignee_name}
            </option>
          ))}
        </select>

        <select 
          value={sort_by} 
          onChange={e => setSortBy(e.target.value)}
          style={{ padding: '8px' }}
        >
          <option value="id">Sort by ID</option>
          <option value="created_at">Sort by Created Date</option>
          <option value="updated_at">Sort by Updated Date</option>
          <option value="priority">Sort by Priority</option>
          <option value="issue_status">Sort by Status</option>
          <option value="title">Sort by Title</option>
        </select>

        <select 
          value={order} 
          onChange={e => setOrder(e.target.value as 'asc' | 'desc')}
          style={{ padding: '8px' }}
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>

        <select 
          value={pageSize} 
          onChange={e => {
            setPageSize(Number(e.target.value));
            setCurrentPage(1);
          }}
          style={{ padding: '8px' }}
        >
          <option value="5">5 per page</option>
          <option value="10">10 per page</option>
          <option value="20">20 per page</option>
          <option value="50">50 per page</option>
        </select>

        <button 
          onClick={() => setShowCreateForm(true)}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          + Create Issue
        </button>
      </div>

      {/* Issues Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>ID</th>
            <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Title</th>
            <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Status</th>
            <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Priority</th>
            <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Assignee</th>
            <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Verified By</th>
            <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Created</th>
            <th colSpan={2} style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {issues.map(issue => (
            <tr 
              key={issue.id} 
              onClick={() => navigate(`/${issue.id}`)}
              style={{ cursor: 'pointer', borderBottom: '1px solid #ddd' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <td style={{ padding: '10px' }}>{issue.id}</td>
              <td style={{ padding: '10px' }}>{issue.title}</td>
              <td style={{ padding: '10px' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  backgroundColor: 
                    issue.issue_status === 'open' ? '#ffc107' :
                    issue.issue_status === 'in_progress' ? '#17a2b8' :
                    issue.issue_status === 'resolved' ? '#28a745' :
                    issue.issue_status === 'verified' ? '#6f42c1' :
                    '#dc3545',
                  color: 'white'
                }}>
                  {issue.issue_status}
                </span>
                {issue.verified_at && (
                  <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '2px' }}>
                    Verified: {new Date(issue.verified_at).toLocaleDateString()}
                  </div>
                )}
              </td>
              <td style={{ padding: '10px' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  backgroundColor: 
                    issue.priority === 'low' ? '#28a745' :
                    issue.priority === 'medium' ? '#ffc107' :
                    issue.priority === 'high' ? '#fd7e14' :
                    '#dc3545',
                  color: 'white'
                }}>
                  {issue.priority}
                </span>
              </td>
              <td style={{ padding: '10px' }}>{issue.assignee_name || '-'}</td>
              <td style={{ padding: '10px' }}>
                {issue.verified_by_name || '-'}
                {issue.verified_by_name && issue.verified_by && (
                  <div style={{ fontSize: '11px', color: '#6c757d' }}>
                    ID: {issue.verified_by}
                  </div>
                )}
              </td>
              <td style={{ padding: '10px' }}>
                {new Date(issue.created_at).toLocaleDateString()}
              </td>
              <td style={{ padding: '10px' }}>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    openEditForm(issue);
                  }}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <EditIcon /> Edit
                </button>
              </td>
              <td style={{ padding: '10px' }}>
                <Link to={`/${issue.id}`} style={{ textDecoration: 'none' }}>
                  <button style={{
                    padding: '6px 12px',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <InfoIcon /> View
                  </button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {issues.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
          No issues found. Try adjusting your filters or create a new issue.
        </div>
      )}

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          Showing {issues.length} of {totalCount} issues
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            disabled={currentPage === 1} 
            onClick={() => handlePageChange(currentPage - 1)}
            style={{
              padding: '8px 16px',
              backgroundColor: currentPage === 1 ? '#e9ecef' : '#007bff',
              color: currentPage === 1 ? '#6c757d' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Prev
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button 
            disabled={currentPage === totalPages} 
            onClick={() => handlePageChange(currentPage + 1)}
            style={{
              padding: '8px 16px',
              backgroundColor: currentPage === totalPages ? '#e9ecef' : '#007bff',
              color: currentPage === totalPages ? '#6c757d' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next
          </button>
        </div>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2>Create New Issue</h2>
            <form onSubmit={handleCreateSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Title *
                </label>
                <input
                  required
                  value={issueTitle}
                  onChange={e => setIssueTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Description
                </label>
                <textarea
                  value={issueDescription}
                  onChange={e => setIssueDescription(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '100px' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Status *
                </label>
                <select
                  value={issueStatusField}
                  onChange={e => {
                    setIssueStatusField(e.target.value);
                    if (e.target.value === 'verified') {
                      setMarkVerified(true);
                    } else {
                      setMarkVerified(false);
                    }
                  }}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="verified">Verified</option>
                  <option value="closed">Closed</option>
                </select>
                {issueStatusField === 'verified' && (
                  <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                    Note: Verified issues require a verifier
                  </div>
                )}
              </div>

              {issueStatusField === 'verified' && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Verifier *
                  </label>
                  <select
                    value={verifierId ?? ''}
                    onChange={e => setVerifierId(e.target.value ? Number(e.target.value) : null)}
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <option value="">Select Verifier</option>
                    {assignees.map(a => (
                      <option key={a.id} value={a.id}>{a.assignee_name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Priority *
                </label>
                <select
                  value={issuePriority}
                  onChange={e => setIssuePriority(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Assignee
                </label>
                <select
                  value={selectedAssigneeId ?? ''}
                  onChange={e => setSelectedAssigneeId(e.target.value ? Number(e.target.value) : null)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">Auto Assign (Available Today)</option>
                  {availableAssignees.map(a => (
                    <option key={a.id} value={a.id}>{a.assignee_name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    resetCreateForm();
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Create Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {showEditForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2>Edit Issue #{issueId}</h2>
            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Title *
                </label>
                <input
                  required
                  value={issueTitle}
                  onChange={e => setIssueTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Description
                </label>
                <textarea
                  value={issueDescription}
                  onChange={e => setIssueDescription(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '100px' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Status *
                </label>
                <select
                  value={issueStatusField}
                  onChange={e => {
                    setIssueStatusField(e.target.value);
                    if (e.target.value === 'verified') {
                      setMarkVerified(true);
                    } else {
                      setMarkVerified(false);
                    }
                  }}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="verified">Verified</option>
                  <option value="closed">Closed</option>
                </select>
                {issueStatusField === 'verified' && (
                  <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                    Note: Verified issues require a verifier
                  </div>
                )}
              </div>

              {issueStatusField === 'verified' && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Verifier *
                  </label>
                  <select
                    value={verifierId ?? ''}
                    onChange={e => setVerifierId(e.target.value ? Number(e.target.value) : null)}
                    required
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                  >
                    <option value="">Select Verifier</option>
                    {assignees.map(a => (
                      <option key={a.id} value={a.id}>{a.assignee_name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Priority *
                </label>
                <select
                  value={issuePriority}
                  onChange={e => setIssuePriority(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Assignee
                </label>
                <select
                  value={selectedAssigneeId ?? ''}
                  onChange={e => setSelectedAssigneeId(e.target.value ? Number(e.target.value) : null)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">No Assignee</option>
                  {assignees.map(a => (
                    <option key={a.id} value={a.id}>{a.assignee_name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    resetEditForm();
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Update Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;