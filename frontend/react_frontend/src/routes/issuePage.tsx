import axios from 'axios';
import { useEffect, useState } from 'react';
//import React from 'react'
import { useParams } from 'react-router-dom'
import LoadingComponent from '../components/loading';

const API_BASE = "http://localhost:8000"

const IssuePage = () => {
  const { issueId } = useParams<{ issueId?: string }>();
  const [issue, setIssue] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchIssue();
  }, [issueId])

  const fetchIssue = async() =>{
    try{
      setLoading(true);
      const response = await axios.get(`${API_BASE}/issues/${issueId}`, {
        params: {
          issue_id: issueId
        }
      })
      console.log("fetched issue: ", response.data);
      setIssue(response.data);
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
    catch(err){
      console.log("Error fetching issue details: ", err);
    }
  }
  return (
    <>
    {loading ? <LoadingComponent/> : (
      <div>
        <h1>Issue Details</h1>
        
        <pre>
          <p style={{textAlign:'left'}}>Details displayed in JSON format</p>
          <hr/>
          {JSON.stringify(issue, null, 2)}
        </pre>
      </div>
    )}
    </>
  )
}

export default IssuePage