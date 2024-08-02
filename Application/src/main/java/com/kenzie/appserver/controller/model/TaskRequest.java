package com.kenzie.appserver.controller.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

/**
 * Represents a request for creating or updating a task.
 * This class holds the data required for a task, including title, description,
 * assigned person, status, priority, and due date.
 */
public class TaskRequest {

    @NotBlank(message = "Title cannot be blank")
    @Size(min = 1, max = 50, message = "Title must be between 1 and 50 characters")
    @JsonProperty("title")
    private String title;

    @NotBlank(message = "Description cannot be blank")
    @Size(min = 1, max = 200, message = "Description must be between 1 and 200 characters")
    @JsonProperty("description")
    private String description;

    @NotBlank(message = "AssignedTo cannot be blank")
    @JsonProperty("assignedTo")
    private String assignedTo;

    @NotBlank(message = "Status cannot be blank")
    @JsonProperty("status")
    private String status;

    @NotBlank(message = "Priority cannot be blank")
    @JsonProperty("priority")
    private String priority;

    @JsonFormat(shape =  JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    @JsonProperty("taskDueDate")
    private String taskDueDate;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getTaskDueDate() {
        return taskDueDate;
    }

    public void setTaskDueDate(String taskDueDate) {
        this.taskDueDate = taskDueDate;
    }
}
