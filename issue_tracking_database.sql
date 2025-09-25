use issue_tracker_db;

CREATE TABLE IF NOT EXISTS issues (
	id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    issue_description TEXT,
    issue_status ENUM('open', 'in-progress', 'resolved', 'closed') DEFAULT 'open',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    assignee VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FULLTEXT INDEX idx_text (title, issue_description),
    INDEX idx_issue_status (issue_status),
    INDEX idx_priority (priority),
    INDEX idx_assignee (assignee)
);

INSERT INTO issues (title, issue_description, issue_status, priority, assignee)
VALUES
('Login button not working', 'Users report that the login button does not respond on click.', 'open', 'high', 'Alice'),
('UI misalignment on dashboard', 'The dashboard widgets overlap on smaller screens.', 'in-progress', 'medium', 'Bob'),
('Payment gateway error', 'Payments fail when using credit cards from certain banks.', 'open', 'critical', 'Charlie'),
('Forgot password email not sent', 'Password reset emails are not being triggered.', 'resolved', 'high', 'David'),
('Search functionality slow', 'Search results take more than 10 seconds to appear.', 'open', 'medium', 'Eve'),
('Profile picture upload fails', 'Users cannot upload a new profile picture.', 'in-progress', 'low', 'Frank'),
('Notification bug', 'Push notifications are being sent multiple times.', 'closed', 'medium', 'Grace'),
('Data export incomplete', 'CSV export does not include all columns.', 'open', 'high', 'Hannah'),
('Session timeout too short', 'Users get logged out after 5 minutes of inactivity.', 'open', 'low', 'Isaac'),
('Dark mode toggle missing', 'The option to enable dark mode is not visible in settings.', 'open', 'medium', 'Julia');


SELECT * FROM issues;