package com.kenzie.appserver.service;

import com.kenzie.appserver.config.CacheStore;
import com.kenzie.appserver.controller.model.TaskRequest;
import com.kenzie.appserver.controller.model.TaskResponse;
import com.kenzie.appserver.repositories.TaskRepository;
import com.kenzie.appserver.repositories.model.TaskRecord;
import com.kenzie.appserver.service.converter.TaskConverter;
import com.kenzie.capstone.service.client.LambdaServiceClient;
import com.kenzie.capstone.service.model.TaskData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * Service class for managing tasks.
 * <p>
 * This class provides methods to create, update, retrieve, and delete tasks,
 * as well as to handle caching and interaction with external services.
 * </p>
 */
@Service
public class TaskService {

    private final CacheStore cache;
    private final TaskConverter taskConverter;
    private final TaskRepository taskRepository;
    private final LambdaServiceClient lambdaServiceClient;

    /**
     * Constructs a new TaskService with the specified dependencies.
     *
     * @param cache                The cache store for caching task data.
     * @param taskRepository       The repository for performing database operations on tasks.
     * @param lambdaServiceClient  The client for interacting with AWS Lambda services.
     */
    @Autowired
    public TaskService(CacheStore cache, TaskConverter taskConverter, TaskRepository taskRepository, LambdaServiceClient lambdaServiceClient) {
        this.cache = cache;
        this.taskConverter = taskConverter;
        this.taskRepository = taskRepository;
        this.lambdaServiceClient = lambdaServiceClient;
    }

    /**
     * Creates a new task based on the provided request data.
     * <p>
     * This method generates a new task ID, creates a {@link TaskRecord} from the request,
     * saves the record to the repository, updates the cache, and returns the created task
     * in the form of a {@link TaskResponse}.
     * It also notifies the Lambda service about the new task creation.
     * </p>
     *
     * @param taskRequest The request containing the details of the task to be created.
     * @return The response containing the details of the created task.
     * @throws IllegalArgumentException if the taskRequest is null.
     */
    public TaskResponse createTask(TaskRequest taskRequest) {

        // Validating create task request
        if (taskRequest == null) {
            throw new IllegalArgumentException("TaskRequest cannot be null");
        }

        // Generating random taskId
        String taskId = UUID.randomUUID().toString();

        // Creating the TaskRecord and Set the taskId
        TaskRecord record = taskConverter.fromRequestToRecord(taskRequest);
        record.setTaskId(taskId);

        // Saving the record to the repository
        taskRepository.save(record);

        // Updating cache
        cache.add(record.getTaskId(), record);

        // Notifying the Lambda service about the new task creation
        lambdaServiceClient.createTask(taskConverter.fromRecordToTaskData(record));

        // Returning the response from the created record
        return taskConverter.fromRecordToResponse(record);
    }


    /**
     * Retrieves a task by its ID.
     * <p>
     * This method checks the cache first for the task record. If not found in the cache,
     * it retrieves the task from the repository, updates the cache, and returns the task
     * in the form of a {@link TaskResponse}.
     * </p>
     *
     * @param taskId The ID of the task to be retrieved.
     * @return The response containing the details of the retrieved task.
     * @throws IllegalArgumentException if the taskId is null.
     */
    public TaskResponse getTask(String taskId) {

        // Validating the task ID
        if (taskId == null || taskId.isEmpty()) {
            throw new IllegalArgumentException("Task ID cannot be null or empty");
        }

        // Checking if the task is cached
        TaskRecord cachedRecord = cache.get(taskId);
        if (cachedRecord != null) {
            return taskConverter.fromRecordToResponse(cachedRecord);
        }

        // Retrieving the task record is from the database
        TaskRecord retrievedTaskRecord = taskRepository.findById(taskId).
                orElseThrow(() -> new IllegalArgumentException("Task ID not found for ID: " + taskId));

        // Updating cache
        cache.add(retrievedTaskRecord.getTaskId(), retrievedTaskRecord);

        // Returning retrievedTaskRecord
        return taskConverter.fromRecordToResponse(retrievedTaskRecord);
    }

    /**
     * Retrieves all tasks (completed & not completed).
     * <p>
     * This method queries the repository to find All tasks.
     * </p>
     *
     * @return A list of {@link TaskRecord} objects representing all tasks.
     */
    public List<TaskRecord> getAllTasks() { return taskRepository.findAll(); }


    /**
     * Retrieves all tasks that are not completed.
     * <p>
     * This method queries the repository to find tasks with a status other than "completed".
     * </p>
     *
     * @return A list of {@link TaskRecord} objects representing uncompleted tasks.
     */
    public List<TaskRecord> getIncompleteTasks() {
        return taskRepository.findByStatusNot("Completed");
    }


    /**
     * Retrieves all tasks that are completed.
     * <p>
     * This method queries the repository to find tasks with a status of "completed".
     * </p>
     *
     * @return A list of {@link TaskRecord} objects representing completed tasks.
     */
    public List<TaskRecord> getCompletedTasks() {
        return taskRepository.findByStatus("Completed");
    }


    /**
     * Updates an existing task based on the provided task ID and request data.
     * <p>
     * This method retrieves the existing task from the repository, updates it with the
     * new data from the request, saves the updated task to the repository, updates the cache,
     * and returns the updated task in the form of a {@link TaskResponse}.
     * It also notifies the Lambda service about the updated task.
     * </p>
     *
     * @param taskId      The ID of the task to be updated.
     * @param taskRequest The request containing the new details for the task.
     * @return The response containing the details of the updated task.
     * @throws IllegalArgumentException if the taskId is null or empty, or if the task is not found.
     */
    public TaskRecord updateTask(String taskId, TaskRequest taskRequest) {

        // Validating the task ID
        if (taskId == null || taskId.isEmpty()) {
            throw new IllegalArgumentException("Task ID cannot be null or empty");
        }

        // Retrieving the existing task record
        TaskRecord updatedRecord = taskRepository.findById(taskId).
                orElseThrow(() -> new IllegalArgumentException("Task ID not found for ID: " + taskId));

        // Updating the existing record with new data
        updatedRecord.setTitle(taskRequest.getTitle());
        updatedRecord.setDescription(taskRequest.getDescription());
        updatedRecord.setAssignedTo(taskRequest.getAssignedTo());
        updatedRecord.setStatus(taskRequest.getStatus());
        updatedRecord.setPriority(taskRequest.getPriority());
        updatedRecord.setTaskDueDate(taskRequest.getTaskDueDate());

        // Saving the updated task
        taskRepository.save(updatedRecord);

        // Updating cache
        cache.add(updatedRecord.getTaskId(), updatedRecord);

        // Creating TaskData and Updating task through LambdaServiceClient
        TaskData taskData = taskConverter.fromRecordToTaskData(updatedRecord);

        // Notifying Lambda service about the update
        lambdaServiceClient.updateTask(taskData.getTaskId(), taskData);

        // Returning the updated task record
        return updatedRecord;
    }


    /**
     * Deletes a task by its ID.
     * <p>
     * This method retrieves the task record from the repository, deletes it, removes it from the cache,
     * and returns the deleted task in the form of a {@link TaskResponse}.
     * It also notifies the Lambda service about the task deletion.
     * </p>
     *
     * @param taskId The ID of the task to be deleted.
     * @return The response containing the details of the deleted task.
     * @throws IllegalArgumentException if the taskId is null or empty, or if the task is not found.
     */
    public TaskRecord deleteTask(String taskId) {

        // Validating the task ID
        if (taskId == null || taskId.isEmpty()) {
            throw new IllegalArgumentException("Task ID cannot be null or empty");
        }

        // Retrieving the record before deletion
        TaskRecord deletedRecord = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found for ID: " + taskId));

        // Deleting record from repository
        taskRepository.deleteById(taskId);

        // Evict from cache
        cache.evict(taskId);

        // Notifying Lambda service about the task deletion
        boolean deletionResult = lambdaServiceClient.deleteTask(taskId);
        if (!deletionResult) {
            throw new RuntimeException("Failed to delete task in Lambda service");
        }

        // Returning deleted record
        return deletedRecord;
    }
}