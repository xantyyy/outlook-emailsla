import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './BugDetails.css';

const BugDetails = () => {
  const { id } = useParams();
  const [bug, setBug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    fetchBugDetails();
  }, [id]);

  const fetchBugDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/bug-reports/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setBug(data.data);
      }
    } catch (error) {
      console.error('Error fetching bug details:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBug = async (updates) => {
    try {
      const response = await fetch(`http://localhost:5000/api/bug-reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      const data = await response.json();
      if (data.success) {
        setBug(data.data);
      }
    } catch (error) {
      console.error('Error updating bug:', error);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    
    await updateBug({ 
      notes: newNote,
      addedBy: 'Admin' // Replace with actual user
    });
    
    setNewNote('');
    fetchBugDetails();
  };

  if (loading) {
    return <div className="loading">Loading bug details...</div>;
  }

  if (!bug) {
    return <div className="error">Bug not found</div>;
  }

  return (
    <div className="bug-details-container">
      <div className="details-header">
        <button onClick={() => window.history.back()} className="back-btn">
          ← Back to List
        </button>
        <h1>{bug.subject}</h1>
      </div>

      <div className="details-grid">
        {/* Main Info */}
        <div className="details-card">
          <h2>Bug Information</h2>
          
          <div className="info-group">
            <label>Status</label>
            <select 
              value={bug.status}
              onChange={(e) => updateBug({ status: e.target.value })}
              className="status-select"
            >
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="Testing">Testing</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="info-group">
            <label>Priority</label>
            <select 
              value={bug.priority}
              onChange={(e) => updateBug({ priority: e.target.value })}
              className="priority-select"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div className="info-group">
            <label>Category</label>
            <select 
              value={bug.category}
              onChange={(e) => updateBug({ category: e.target.value })}
              className="category-select"
            >
              <option value="UI/UX">UI/UX</option>
              <option value="Backend">Backend</option>
              <option value="Database">Database</option>
              <option value="API">API</option>
              <option value="Performance">Performance</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="info-group">
            <label>Assign To</label>
            <select 
              value={bug.assignedTo || ''}
              onChange={(e) => updateBug({ assignedTo: e.target.value })}
              className="assign-select"
            >
              <option value="">Unassigned</option>
              <option value="Kawander">Kawander</option>
              <option value="Hernani">Hernani</option>
              <option value="Almira">Almira</option>
              <option value="Charmaine">Charmaine</option>
              <option value="Houston">Houston</option>
            </select>
          </div>
        </div>

        {/* Reporter Info */}
        <div className="details-card">
          <h2>Reported By</h2>
          <p><strong>Name:</strong> {bug.reportedBy.name}</p>
          <p><strong>Email:</strong> {bug.reportedBy.email}</p>
          <p><strong>Date:</strong> {new Date(bug.receivedAt).toLocaleString()}</p>
        </div>
      </div>

      {/* Description */}
      <div className="details-card full-width">
        <h2>Description</h2>
        <div className="description-text">{bug.description}</div>
      </div>

      {/* Attachments */}
      {bug.attachments && bug.attachments.length > 0 && (
        <div className="details-card full-width">
          <h2>Attachments ({bug.attachments.length})</h2>
          <div className="attachments-list">
            {bug.attachments.map((att, idx) => (
              <div key={idx} className="attachment-item">
                📎 {att.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="details-card full-width">
        <h2>Notes & Updates</h2>
        
        <div className="notes-list">
          {bug.notes && bug.notes.length > 0 ? (
            bug.notes.map((note, idx) => (
              <div key={idx} className="note-item">
                <div className="note-header">
                  <strong>{note.addedBy}</strong>
                  <span>{new Date(note.addedAt).toLocaleString()}</span>
                </div>
                <p>{note.text}</p>
              </div>
            ))
          ) : (
            <p className="no-notes">No notes yet</p>
          )}
        </div>

        <div className="add-note">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note or update..."
            rows="3"
          />
          <button onClick={addNote} className="add-note-btn">
            Add Note
          </button>
        </div>
      </div>
    </div>
  );
};

export default BugDetails;