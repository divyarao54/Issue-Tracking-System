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

CREATE TABLE IF NOT EXISTS assignees(
	id INT AUTO_INCREMENT PRIMARY KEY,
    assignee_name VARCHAR(255) NOT NULL
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

ALTER TABLE assignees
ADD CONSTRAINT uniq_assignee_name UNIQUE (assignee_name);


ALTER TABLE issues
ADD COLUMN assignee_id INT NULL,
ADD COLUMN assigned_date DATE NULL,
ADD INDEX idx_assignee_date (assignee_id, assigned_date),
ADD CONSTRAINT fk_issues_assignee
    FOREIGN KEY (assignee_id)
    REFERENCES assignees(id)
    ON DELETE SET NULL,
ADD CONSTRAINT uniq_assignee_day
    UNIQUE (assignee_id, assigned_date);

INSERT INTO assignees (assignee_name) VALUES
('Aarav Sharma'),
('Diya Patel'),
('Rohan Mehta'),
('Ananya Iyer'),
('Kunal Verma'),
('Priya Nair'),
('Aditya Singh'),
('Neha Gupta'),
('Siddharth Rao'),
('Mehul Jain');

SELECT * FROM assignees;

DELETE FROM issues WHERE 1=1;

INSERT INTO issues (title, issue_description, issue_status, priority, assignee) VALUES
(
  'Login page not loading',
  'Users report a blank screen when accessing the login page on Chrome.',
  'open',
  'high',
  'Aarav Sharma'
),
(
  'Incorrect total in billing module',
  'The billing module shows incorrect totals when multiple discounts are applied.',
  'in-progress',
  'critical',
  'Diya Patel'
),
(
  'UI alignment issue on dashboard',
  'Widgets overlap on smaller screen sizes in the dashboard view.',
  'open',
  'medium',
  'Rohan Mehta'
),
(
  'Password reset email not sent',
  'Password reset emails are not being delivered to Gmail users.',
  'resolved',
  'high',
  'Ananya Iyer'
),
(
  'Slow response time for search',
  'Search results take more than 8 seconds to load during peak hours.',
  'in-progress',
  'medium',
  'Kunal Verma'
),
(
  'Export to CSV fails',
  'Exporting issues to CSV throws a 500 error intermittently.',
  'open',
  'low',
  'Priya Nair'
),
(
  'Broken link in footer',
  'The "Privacy Policy" link in the footer redirects to a 404 page.',
  'closed',
  'low',
  'Aditya Singh'
),
(
  'Notifications not updating in real time',
  'Users need to refresh the page to see new notifications.',
  'open',
  'medium',
  'Neha Gupta'
),
(
  'Role-based access not enforced',
  'Non-admin users can access admin-only endpoints.',
  'in-progress',
  'critical',
  'Siddharth Rao'
),
(
  'Date filter not working correctly',
  'Filtering issues by date range returns inconsistent results.',
  'resolved',
  'medium',
  'Mehul Jain'
);

ALTER TABLE issues
ADD COLUMN verified_by INT NULL,
ADD COLUMN verified_at TIMESTAMP NULL,
ADD CONSTRAINT fk_issues_verified_by
    FOREIGN KEY (verified_by)
    REFERENCES assignees(id)
    ON DELETE SET NULL;

ALTER TABLE issues
MODIFY issue_status ENUM(
  'open',
  'in-progress',
  'resolved',
  'verified',
  'closed'
) DEFAULT 'open';

SELECT * FROM issues
