import axios from 'axios';
import { useEffect, useState } from 'react';
//import React from 'react'
import { useParams } from 'react-router-dom'

const API_BASE = "http://localhost:8000"

const IssuePage = () => {
  const { issueId } = useParams<{ issueId?: string }>();
  const [issue, setIssue] = useState<any>(null)

  useEffect(() => {
    fetchIssue();
  }, [issueId])

  const fetchIssue = async() =>{
    try{
      const response = await axios.get(`${API_BASE}/issues/${issueId}`, {
        params: {
          issue_id: issueId
        }
      })
      console.log("fetched issue: ", response.data);
      setIssue(response.data);
    }
    catch(err){
      console.log("Error fetching issue details: ", err);
    }
  }
  return (
    <div>
      <h1>Issue Details</h1>
      <pre>
        {JSON.stringify(issue, null, 2)}
      </pre>
    </div>
  )
}

export default IssuePage