import React, { useState, useEffect } from 'react';
import './BugList.css';

const BugList = () => {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: '',
    priority: '',
    search: ''
  });

  useEffect(() => {
    fetchBugs();
  }, [filter]);

  const fetchBugs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      if (filter.status) queryParams.append('status', filter.status);
      if (filter.priority) queryParams.append('priority', filter.priority);
      if (filter.search) queryParams.append('search', filter.search);

      const response = await fetch(`http://localhost:5000/api/bug-reports?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        setBugs(data.data);
      }
    } catch (error) {
      console.error('Error fetching bugs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'Critical': return '#dc3545';
      case 'High': return '#fd7e14';
      case 'Medium': return '#ffc107';
      case 'Low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'New': return '#17a2b8';
      case 'In Progress': return '#007bff';
      case 'Testing': return '#ffc107';
      case 'Resolved': return '#28a745';
      case 'Closed': return '#6c757d';
      default: return '#6c757d';
    }
  };

  return (
    <div className="bug-list-container">
      <div className="page-header">
        <h1>Bug Reports</h1>
        <button className="sync-btn" onClick={fetchBugs}>
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search bugs..."
          value={filter.search}
          onChange={(e) => setFilter({...filter, search: e.target.value})}
          className="search-input"
        />
        
        <select 
          value={filter.status} 
          onChange={(e) => setFilter({...filter, status: e.target.value})}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="New">New</option>
          <option value="In Progress">In Progress</option>
          <option value="Testing">Testing</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>

        <select 
          value={filter.priority} 
          onChange={(e) => setFilter({...filter, priority: e.target.value})}
          className="filter-select"
        >
          <option value="">All Priority</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* Bug List */}
      {loading ? (
        <div className="loading">Loading bugs...</div>
      ) : (
        <div className="bug-grid">
          {bugs.length === 0 ? (
            <div className="no-bugs">No bug reports found</div>
          ) : (
            bugs.map(bug => (
              <div key={bug._id} className="bug-card">
                <div className="bug-header">
                  <h3>{bug.subject}</h3>
                  <div className="bug-badges">
                    <span 
                      className="badge priority"
                      style={{backgroundColor: getPriorityColor(bug.priority)}}
                    >
                      {bug.priority}
                    </span>
                    <span 
                      className="badge status"
                      style={{backgroundColor: getStatusColor(bug.status)}}
                    >
                      {bug.status}
                    </span>
                  </div>
                </div>

                <p className="bug-description">
                  {bug.description.substring(0, 150)}...
                </p>

                <div className="bug-meta">
                  <span>📧 {bug.reportedBy.name}</span>
                  <span>🗂️ {bug.category}</span>
                  <span>📅 {new Date(bug.receivedAt).toLocaleDateString()}</span>
                </div>

                <button 
                  className="view-btn"
                  onClick={() => window.location.href = `/bug-details/${bug._id}`}
                >
                  View Details →
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default BugList;