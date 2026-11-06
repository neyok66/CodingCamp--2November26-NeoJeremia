# Requirements Document

## Introduction

This document specifies the requirements for the **Todo List Life Dashboard**, a single-page web application that serves as a personal productivity home screen. The Dashboard combines four widgets on a single view: a time-based Greeting, a 25-minute Focus Timer, a persistent To-Do List, and a set of Quick Links to favorite websites. The application is built entirely with vanilla HTML, CSS, and JavaScript and stores all user data client-side using the browser Local Storage API, requiring no backend server.

## Glossary

- **Dashboard**: The complete Todo List Life Dashboard single-page web application.
- **Greeting_Widget**: The component that displays the current time, current date, and a greeting message that changes based on the time of day.
- **Focus_Timer**: The countdown timer component that counts down from a fixed 25-minute duration and provides Start, Stop, and Reset controls.
- **To_Do_List**: The task management component that stores tasks, lets users add, edit, mark complete, and delete tasks, and persists them across sessions.
- **Quick_Links**: The component that renders saved favorite websites as clickable buttons and opens them in a new browser tab.
- **Task**: A single to-do entry consisting of a text label and a completion status (done or not done).
- **Quick_Link**: A single saved favorite website entry consisting of a display name and a URL.
- **Local_Storage**: The browser `localStorage` Web API used to persist user data client-side as key-value pairs.
- **MM:SS**: A time display format with two-digit minutes, a colon, and two-digit seconds (for example, 25:00, 04:07).

## Requirements

### Requirement 1: Time and Date Display

**User Story:** As a user, I want to see the current time and date at a glance, so that I can orient myself when I open the Dashboard.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current time (including hours, minutes, and seconds) and update the displayed time at intervals of no more than 1 second.
2. THE Greeting_Widget SHALL display the current date including the day, month, and year.
3. WHILE the Dashboard is open, THE Greeting_Widget SHALL keep the displayed time within 1 second of the system clock and the displayed date matching the system date.

### Requirement 2: Time-Based Greeting

**User Story:** As a user, I want a greeting that matches the time of day, so that the Dashboard feels personal and welcoming.

#### Acceptance Criteria

1. WHEN the current hour in the user's local timezone is between 05:00 and 11:59 inclusive, THE Greeting_Widget SHALL display "Good Morning".
2. WHEN the current hour in the user's local timezone is between 12:00 and 16:59 inclusive, THE Greeting_Widget SHALL display "Good Afternoon".
3. WHEN the current hour in the user's local timezone is between 17:00 and 20:59 inclusive, THE Greeting_Widget SHALL display "Good Evening".
4. WHEN the current hour in the user's local timezone is between 21:00 and 23:59 inclusive or between 00:00 and 04:59 inclusive, THE Greeting_Widget SHALL display "Good Night".
5. WHEN the current hour transitions to a different time period while the Dashboard is displayed, THE Greeting_Widget SHALL update the displayed greeting to reflect the new time period.

### Requirement 3: Focus Timer Countdown

**User Story:** As a user, I want a 25-minute focus timer, so that I can work in focused intervals using the pomodoro technique.

#### Acceptance Criteria

1. WHEN the user starts the focus timer, THE Focus_Timer SHALL initialize the countdown with a 25-minute (1500-second) duration and begin counting down from 1500 seconds.
2. WHILE the timer is counting, THE Focus_Timer SHALL display the remaining time in MM:SS format.
3. WHEN the countdown reaches zero, THE Focus_Timer SHALL stop counting, display 00:00, and present an audible and visual notification indicating that the focus interval is complete.

### Requirement 4: Focus Timer Controls

**User Story:** As a user, I want Start, Stop, and Reset controls, so that I can control the focus timer as I work.

#### Acceptance Criteria

1. WHEN the Start button is pressed, THE Focus_Timer SHALL begin counting down from the remaining duration, decrementing the remaining duration at 1-second intervals.
2. WHEN the Stop button is pressed, THE Focus_Timer SHALL pause the countdown and preserve the remaining duration.
3. WHEN the Reset button is pressed, THE Focus_Timer SHALL restore the timer to 25 minutes and stop counting.
4. WHILE the Focus_Timer is counting down, WHEN the Start button is pressed, THE Focus_Timer SHALL continue counting down without resetting the remaining duration.
5. WHEN the remaining duration reaches zero, THE Focus_Timer SHALL stop counting down.

### Requirement 5: To-Do List Task Management

**User Story:** As a user, I want to add, edit, complete, and delete tasks, so that I can manage my daily responsibilities in one place.

#### Acceptance Criteria

1. WHEN a user submits a new task with text that, after excluding leading and trailing whitespace, contains between 1 and 200 characters, THE To_Do_List SHALL add the task to the displayed list and persist the task to Local_Storage.
2. WHEN a user edits an existing task with text that, after excluding leading and trailing whitespace, contains between 1 and 200 characters, THE To_Do_List SHALL update the task text and persist the change to Local_Storage.
3. WHEN a user marks a task as done, THE To_Do_List SHALL update the task completion status and persist the change to Local_Storage.
4. WHEN a user deletes a task, THE To_Do_List SHALL remove the task from the displayed list and from Local_Storage.
5. IF a user submits a task with text that is empty or contains only whitespace, THEN THE To_Do_List SHALL reject the task, display an error message indicating the task text cannot be empty, and keep the task list and Local_Storage unchanged.
6. IF a user edits an existing task with text that is empty or contains only whitespace, THEN THE To_Do_List SHALL reject the edit, display an error message indicating the task text cannot be empty, and keep the task text and Local_Storage unchanged.
7. IF a user submits or edits a task with text that, after excluding leading and trailing whitespace, exceeds 200 characters, THEN THE To_Do_List SHALL reject the input, display an error message indicating the task text exceeds the maximum length, and keep the task list and Local_Storage unchanged.

### Requirement 6: To-Do List Persistence

**User Story:** As a user, I want my tasks to persist between browser sessions, so that I do not lose my list when I close the tab.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE To_Do_List SHALL load all saved tasks from Local_Storage and display each task with the same text label and the same done or not-done completion status it had when last persisted.
2. WHEN the To_Do_List persists a task to Local_Storage and the Dashboard reloads, THE To_Do_List SHALL restore a set of tasks with the same count, the same text labels, and the same completion statuses as the tasks that were persisted.
3. IF Local_Storage contains no saved tasks when the Dashboard loads, THEN THE To_Do_List SHALL display zero tasks.

### Requirement 7: Quick Links Management

**User Story:** As a user, I want buttons that open my favorite websites, so that I can jump to them quickly from the Dashboard.

#### Acceptance Criteria

1. WHEN a user adds a Quick_Link with a name and a URL, THE Quick_Links component SHALL create a button for the link and persist the link to Local_Storage.
2. WHEN a user clicks a Quick_Link button, THE Quick_Links component SHALL open the associated URL in a new browser tab.
3. WHEN a user deletes a Quick_Link, THE Quick_Links component SHALL remove the link from Local_Storage and remove its button from the Dashboard.
4. IF a user adds a Quick_Link with an empty or whitespace-only name, an empty or whitespace-only URL, or a URL that does not begin with "http://" or "https://", or when 50 links are already stored, THEN THE Quick_Links component SHALL reject the link, display an error message to the user, and keep the links list and Local_Storage unchanged.

### Requirement 8: Quick Links Persistence

**User Story:** As a user, I want my quick links to persist between browser sessions, so that they are always available.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Quick_Links component SHALL load all saved links from Local_Storage and display them as buttons.
2. WHEN the Quick_Links component persists a link to Local_Storage and the Dashboard reloads, THE Quick_Links component SHALL restore each saved link with the same display name and the same URL it had when last persisted.
3. IF Local_Storage contains no saved links when the Dashboard loads, THEN THE Quick_Links component SHALL display no buttons and produce no error.

### Requirement 9: Technology Stack and Project Structure

**User Story:** As a developer, I want a simple technology stack with a clean structure, so that the application is easy to build and maintain.

#### Acceptance Criteria

1. THE Dashboard SHALL provide its document structure in a single HTML file that links the CSS file and the JavaScript file.
2. THE Dashboard SHALL provide all styling in a single CSS file located inside the ``css/`` directory, with no inline styling in the HTML file.
3. THE Dashboard SHALL provide all behavior in a single JavaScript file located inside the ``js/`` directory, with no inline scripts in the HTML file.
4. THE Dashboard SHALL be implemented using only vanilla JavaScript, HTML, and CSS, without referencing any external frameworks or libraries.

### Requirement 10: Client-Side Data Storage

**User Story:** As a user, I want my data stored on my device, so that I can use the Dashboard without a server or account.

#### Acceptance Criteria

1. THE Dashboard SHALL store all tasks and Quick_Links in Local_Storage on the client device and persist them across browser sessions.
2. THE Dashboard SHALL operate entirely client-side and require no backend server for any feature.
3. WHEN the Dashboard loads, THE Dashboard SHALL load all saved tasks and Quick_Links from Local_Storage.
4. IF a Local_Storage write fails due to quota exceeded or unavailability, THEN THE Dashboard SHALL handle the error without crashing.

### Requirement 11: Browser Compatibility

**User Story:** As a user, I want the Dashboard to work in my browser of choice, so that I am not locked into a specific browser.

#### Acceptance Criteria

1. THE Dashboard SHALL render all visible UI elements without layout errors and execute all interactive features without generating JavaScript console errors in the two most recent major versions of Google Chrome, Mozilla Firefox, Microsoft Edge, and Apple Safari.
2. THE Dashboard SHALL load and execute all features without requiring a web server, external network requests, or a build step when the HTML file is opened directly in a browser.

### Requirement 12: Performance

**User Story:** As a user, I want a fast and responsive Dashboard, so that interacting with it feels smooth.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Dashboard SHALL display all four widgets within 2 seconds on Google Chrome, Mozilla Firefox, Microsoft Edge, or Apple Safari.
2. WHEN a user adds, edits, completes, or deletes a task, THE To_Do_List SHALL update the display and persist to Local_Storage within 300 milliseconds.
3. WHEN a user adds or deletes a Quick_Link, THE Quick_Links component SHALL update the display and persist to Local_Storage within 300 milliseconds.

### Requirement 13: Visual Design

**User Story:** As a user, I want a clean and readable interface, so that I can use the Dashboard comfortably every day.

#### Acceptance Criteria

1. THE Dashboard SHALL present only defined content elements per widget with no overlapping content areas across all widgets.
2. THE Dashboard SHALL establish consistent spacing between adjacent widgets and visually identifiable widget boundaries that distinguish the four widgets.
3. THE Dashboard SHALL use typography with a font size of at least 16 pixels and a contrast ratio of at least 4.5:1 against the background for the time, date, greeting, tasks, and Quick_Link display names.
