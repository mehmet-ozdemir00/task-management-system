package com.kenzie.capstone.service.model;

import java.util.Objects;

/**
 * Represents the data related to a task.
 */
public class TaskData {

    private String taskId;
    private String taskTitle;
    private String description;
    private String assignedTo;
    private String priority;
    private String status;
    private String dueDate;

    public TaskData() {

    }

    public TaskData(String taskId, String taskTitle, String description, String assignedTo, String priority, String status, String dueDate) {
        this.taskId = taskId;
        this.taskTitle = taskTitle;
        this.description = description;
        this.assignedTo = assignedTo;
        this.priority = priority;
        this.status = status;
        this.dueDate = dueDate;
    }

    public String getTaskId() {
        return taskId;
    }

    public void setTaskId(String taskId) {
        this.taskId = taskId;
    }

    public String getTaskTitle() {
        return taskTitle;
    }

    public void setTaskTitle(String taskTitle) {
        this.taskTitle = taskTitle;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(String assignedTo) {
        this.assignedTo = assignedTo;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDueDate() {
        return dueDate;
    }

    public void setDueDate(String dueDate) {
        this.dueDate = dueDate;
    }

    @Override
    public String toString() {
        return "TaskData{" +
                "taskId='" + taskId + '\'' +
                ", taskTitle='" + taskTitle + '\'' +
                ", description='" + description + '\'' +
                ", assignedTo='" + assignedTo + '\'' +
                ", priority='" + priority + '\'' +
                ", status='" + status + '\'' +
                ", dueDate='" + dueDate + '\'' +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof TaskData)) return false;
        TaskData taskData = (TaskData) o;
        return Objects.equals(taskId, taskData.taskId) && Objects.equals(taskTitle, taskData.taskTitle) && Objects.equals(description, taskData.description) && Objects.equals(assignedTo, taskData.assignedTo) && Objects.equals(priority, taskData.priority) && Objects.equals(status, taskData.status) && Objects.equals(dueDate, taskData.dueDate);
    }

    @Override
    public int hashCode() {
        return Objects.hash(taskId, taskTitle, description, assignedTo, priority, status, dueDate);
    }
}
