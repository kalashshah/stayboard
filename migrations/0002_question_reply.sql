-- Host reply to a question the guide couldn't answer; shown back to the guest who asked.
ALTER TABLE questions ADD COLUMN reply TEXT;
ALTER TABLE questions ADD COLUMN replied_at INTEGER;
