package com.kenzie.capstone.service;

import com.kenzie.capstone.service.dao.TaskDao;
import com.kenzie.capstone.service.exceptions.InvalidDataException;
import com.kenzie.capstone.service.model.DataRecord;
import com.kenzie.capstone.service.model.TaskData;

import javax.inject.Inject;
import java.time.LocalDateTime;

/**
 * Provides services for managing task data using the TaskDao.
 * This class contains methods to get, create, update, and delete task records.
 */
public class LambdaService {

    private final TaskDao taskDao;

    /**
     * Constructs a LambdaService with the specified TaskDao.
     *
     * @param taskDao The TaskDao instance used for data access operations.
     */
    @Inject
    public LambdaService(TaskDao taskDao) {
        this.taskDao = taskDao;
    }


    /**
     * Retrieves the details of a task by its ID.
     *
     * @param taskId The ID of the task to retrieve.
     * @return The DataRecord representing the task details.
     * @throws InvalidDataException if the task ID is null or empty.
     */
    public DataRecord getTaskDetails(String taskId) {

        if (taskId == null || taskId.isEmpty()) {
            throw new InvalidDataException("Task ID must be provided");
        } else {
            return taskDao.getTaskData(taskId);
        }
    }


    /**
     * Creates a new task in the database.
     *
     * @param taskData The TaskData object containing the details of the task to create.
     * @throws InvalidDataException if the taskData object is null, or if any required field
     *         (task ID, task title, description, due date, status) is missing or invalid.
     */
    public void createNewTask(TaskData taskData) {

        // Validating that the taskData is not null
        if (taskData == null) {
            throw new InvalidDataException("TaskData must be provided");
        }

        // Extracting task ID from taskData
        String taskId = taskData.getTaskId();

        if (taskId == null || taskId.isEmpty()) {
            throw new InvalidDataException("Task ID must be provided");
        } else if (taskData.getTaskTitle() == null || taskData.getTaskTitle().isEmpty()) {
            throw new InvalidDataException("Task title must be provided");
        } else if (taskData.getDescription() == null || taskData.getDescription().isEmpty()) {
            throw new InvalidDataException("Description must be provided");
        } else if (taskData.getDueDate() == null) {
            throw new InvalidDataException("Due date must be provided");
        } else if (taskData.getStatus() == null || taskData.getStatus().isEmpty()) {
            throw new InvalidDataException("Status must be provided");
        }

        // Creating a new DataRecord object and setting its attributes from taskData
        DataRecord dataRecord = new DataRecord();
        dataRecord.setTaskId(taskData.getTaskId());
        dataRecord.setTaskTitle(taskData.getTaskTitle());
        dataRecord.setAssignedTo(taskData.getAssignedTo());
        dataRecord.setDescription(taskData.getDescription());
        dataRecord.setStatus(taskData.getStatus());
        dataRecord.setCreatedAt(LocalDateTime.now());
        dataRecord.setUpdatedAt(LocalDateTime.now());

        // Saving the new task data record to the database
        taskDao.createTaskData(dataRecord);
    }


    /**
     * Updates an existing task in the database.
     *
     * @param taskId The ID of the task to update.
     * @param taskData The TaskData object containing the updated details of the task.
     * @return The updated TaskData object.
     * @throws InvalidDataException if the task ID is null or empty, if the task ID does not exist,
     *         or if any required field in taskData is missing or invalid.
     */
    public TaskData updateExistingTask(String taskId, TaskData taskData) {

        // Validating that the task ID is not null or empty
        if (taskId == null || taskId.isEmpty()) {
            throw new InvalidDataException("Task ID must be provided");
        }

        // Retrieving the existing DataRecord from the database
        DataRecord dataRecord = taskDao.getTaskData(taskId);

        // Validating that the task ID exists in the database
        if (dataRecord == null) {
            throw new InvalidDataException("Task ID does not exist");
        }

        // Updating the existing DataRecord with new values from taskData
        dataRecord.setTaskId(taskId);
        dataRecord.setTaskTitle(taskData.getTaskTitle());
        dataRecord.setAssignedTo(taskData.getAssignedTo());
        dataRecord.setDescription(taskData.getDescription());
        dataRecord.setStatus(taskData.getStatus());
        dataRecord.setCreatedAt(LocalDateTime.now());
        dataRecord.setUpdatedAt(LocalDateTime.now());

        // Updating the data record in the database
        DataRecord updatedDataRecord = taskDao.updateTaskData(dataRecord);

        // Converting the updated DataRecord back to TaskData
        TaskData updatedTaskData = new TaskData();
        updatedTaskData.setTaskId(updatedDataRecord.getTaskId());
        updatedTaskData.setTaskTitle(updatedDataRecord.getTaskTitle());
        updatedTaskData.setDescription(updatedDataRecord.getDescription());
        updatedTaskData.setAssignedTo(updatedDataRecord.getAssignedTo());
        updatedTaskData.setStatus(updatedDataRecord.getStatus());

        // Returning the updated TaskData object
        return updatedTaskData;
    }


    /**
     * Deletes a task from the database by its ID.
     *
     * @param taskId The ID of the task to delete.
     * @return true if the task was successfully deleted, false otherwise.
     * @throws InvalidDataException if the task ID is null or empty.
     */
    public boolean deleteTaskFromDatabase(String taskId) {

        if (taskId == null || taskId.isEmpty()) {
            throw new InvalidDataException("Task ID must be provided");
        } else {
            return taskDao.deleteTaskData(taskId);
        }
    }
}