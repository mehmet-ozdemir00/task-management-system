package com.kenzie.appserver.service.converter;

import com.kenzie.appserver.controller.model.TaskRequest;
import com.kenzie.appserver.controller.model.TaskResponse;
import com.kenzie.appserver.repositories.model.TaskRecord;
import com.kenzie.capstone.service.model.TaskData;
import org.springframework.stereotype.Component;

@Component
public class TaskConverter {

    /**
     * Converts a {@link TaskRequest} object to a {@link TaskRecord} object.
     *
     * @param request the {@link TaskRequest} object containing task details
     * @return a {@link TaskRecord} object with the data from the request
     */
    public TaskRecord fromRequestToRecord(TaskRequest request) {
        TaskRecord record = new TaskRecord();
        record.setTitle(request.getTitle());
        record.setDescription(request.getDescription());
        record.setAssignedTo(request.getAssignedTo());
        record.setStatus(request.getStatus());
        record.setPriority(request.getPriority());
        record.setTaskDueDate(request.getTaskDueDate());
        return record;
    }

    /**
     * Converts a {@link TaskRecord} object to a {@link TaskResponse} object.
     *
     * @param record the {@link TaskRecord} object containing task details
     * @return a {@link TaskResponse} object with the data from the record
     */
    public TaskResponse fromRecordToResponse(TaskRecord record) {
        TaskResponse response = new TaskResponse();
        response.setTaskId(record.getTaskId());
        response.setTitle(record.getTitle());
        response.setDescription(record.getDescription());
        response.setAssignedTo(record.getAssignedTo());
        response.setStatus(record.getStatus());
        response.setPriority(record.getPriority());
        response.setTaskDueDate(record.getTaskDueDate());
        return response;
    }

    /**
     * Converts a {@link TaskRecord} object to a {@link TaskData} object.
     *
     * @param record the {@link TaskRecord} object containing task details
     * @return a {@link TaskData} object with the data from the record
     */
    public TaskData fromRecordToTaskData(TaskRecord record) {
        TaskData taskData = new TaskData();
        taskData.setTaskId(record.getTaskId());
        taskData.setTaskTitle(record.getTitle());
        taskData.setDescription(record.getDescription());
        taskData.setAssignedTo(record.getAssignedTo());
        taskData.setStatus(record.getStatus());
        taskData.setPriority(record.getPriority());
        taskData.setDueDate(record.getTaskDueDate());
        return taskData;
    }
}
