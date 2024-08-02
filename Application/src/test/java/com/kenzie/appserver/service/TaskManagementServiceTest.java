package com.kenzie.appserver.service;

import com.kenzie.appserver.config.CacheStore;
import com.kenzie.appserver.controller.model.TaskRequest;
import com.kenzie.appserver.controller.model.TaskResponse;
import com.kenzie.appserver.repositories.TaskRepository;
import com.kenzie.appserver.repositories.model.TaskRecord;
import com.kenzie.appserver.service.converter.TaskConverter;
import com.kenzie.capstone.service.client.LambdaServiceClient;
import com.kenzie.capstone.service.model.TaskData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link TaskService} methods.
 * Uses Mockito for mocking dependencies and verifying interactions.
 */
public class TaskManagementServiceTest {

    private CacheStore cache;
    private TaskService taskService;
    private TaskConverter taskConverter;
    private TaskRepository taskRepository;
    private LambdaServiceClient lambdaServiceClient;

    @BeforeEach
    public void setup() {
        cache = mock(CacheStore.class);
        taskConverter = mock(TaskConverter.class);
        taskRepository = mock(TaskRepository.class);
        lambdaServiceClient = mock(LambdaServiceClient.class);
        taskService = new TaskService(cache, taskConverter, taskRepository, lambdaServiceClient);
    }


    /**  ------------------------------------------------------------------------
     *   TaskService.createTask
     *   ------------------------------------------------------------------------ **/

    /**
     * Tests {@link TaskService#createTask(TaskRequest)} for successful task creation.
     *
     * @param "taskRequest" The request object for creating a task.
     * @return The created task response.
     */
    @Test
    public void testCreateTask_Success() {
        // GIVEN
        TaskRequest taskRequest = new TaskRequest();
        taskRequest.setTitle("Sample Task");

        TaskRecord taskRecord = new TaskRecord();
        String taskId = "sample-task-id";
        taskRecord.setTaskId(taskId);

        TaskResponse expectedResponse = new TaskResponse();
        expectedResponse.setTaskId(taskId);

        when(taskConverter.fromRequestToRecord(taskRequest)).thenReturn(taskRecord);
        when(taskRepository.save(taskRecord)).thenReturn(taskRecord);
        when(cache.get(taskId)).thenReturn(null);
        when(taskConverter.fromRecordToResponse(taskRecord)).thenReturn(expectedResponse);

        // WHEN
        TaskResponse response = taskService.createTask(taskRequest);

        // THEN
        assertEquals(expectedResponse, response);
        verify(taskConverter).fromRequestToRecord(taskRequest);
        verify(lambdaServiceClient, times(1)).createTask(any(TaskData.class));
    }

    /**
     * Tests {@link TaskService#createTask(TaskRequest)} when task creation fails.
     *
     * @param "taskRequest" The request object for creating a task.
     * @return Throws RuntimeException on failure.
     */
    @Test
    public void testCreateTask_Failure() {
        // GIVEN
        TaskRequest taskRequest = new TaskRequest();
        taskRequest.setTitle("Sample Task");

        TaskRecord taskRecord = new TaskRecord();
        when(taskConverter.fromRequestToRecord(taskRequest)).thenReturn(taskRecord);
        when(taskRepository.save(taskRecord)).thenThrow(new RuntimeException("Database error"));

        // WHEN & THEN
        assertThrows(RuntimeException.class, () -> taskService.createTask(taskRequest));
        verify(taskRepository, times(1)).save(any(TaskRecord.class));
        verifyNoMoreInteractions(taskRepository);
    }

    /**
     * Tests {@link TaskService#createTask(TaskRequest)} when taskRequest is null.
     *
     * @param "taskRequest" The request object for creating a task (null in this case).
     * @return Throws IllegalArgumentException.
     */
    @Test
    public void testCreateTask_nullId_throwsException() {
        // GIVEN
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> taskService.createTask(null));

        // WHEN / THEN
        assertEquals("TaskRequest cannot be null", exception.getMessage());
    }


    /**  ------------------------------------------------------------------------
     *   TaskService.getTask
     *   ------------------------------------------------------------------------ **/

    /**
     * Tests {@link TaskService#getTask(String)} for successful task retrieval.
     *
     * @param "taskId" The ID of the task to retrieve.
     * @return The retrieved task response.
     */
    @Test
    public void testGetTask_Success() {
        // GIVEN
        String taskId = "sample-task-id";
        TaskRecord taskRecord = new TaskRecord();
        taskRecord.setTaskId(taskId);

        TaskResponse expectedResponse = new TaskResponse();
        expectedResponse.setTaskId(taskId);

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(taskRecord));
        when(taskConverter.fromRecordToResponse(taskRecord)).thenReturn(expectedResponse);

        // WHEN
        TaskResponse response = taskService.getTask(taskId);

        // THEN
        assertEquals(expectedResponse, response);
    }

    /**
     * Tests {@link TaskService#getTask(String)} when task is not found.
     *
     * @param "taskId" The ID of the task to retrieve (non-existent in this case).
     * @return Throws TaskNotFoundException.
     */
    @Test
    public void testGetTask_Failure() {
        // GIVEN
        String taskId = "non-existent-task-id";
        when(cache.get(taskId)).thenReturn(null);
        when(taskRepository.findById(taskId)).thenReturn(Optional.empty());

        // WHEN & THEN
        assertThrows(IllegalArgumentException.class, () -> taskService.getTask(taskId));
    }

    /**
     * Tests {@link TaskService#getTask(String)} when taskId is null.
     *
     * @param "taskId" The ID of the task to retrieve (null in this case).
     * @return Throws IllegalArgumentException.
     */
    @Test
    public void testGetTask_nullId_throwsException() {
        // GIVEN
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> taskService.getTask(null));

        // WHEN / THEN
        assertEquals("Task ID cannot be null or empty", exception.getMessage());
    }


    /**  ------------------------------------------------------------------------
     *   TaskService.getAllTasks
     *   ------------------------------------------------------------------------ **/

    /**
     * Tests {@link TaskService#getAllTasks()} for successful retrieval of all tasks.
     *
     * @return A list of all task records.
     */
    @Test
    public void testGetAllTasks_Success() {
        // GIVEN
        List<TaskRecord> taskRecords = new ArrayList<>();
        TaskRecord taskRecord = new TaskRecord();
        taskRecord.setTaskId("sample-task-id");
        taskRecords.add(taskRecord);

        when(taskRepository.findAll()).thenReturn(taskRecords);

        // WHEN
        List<TaskRecord> responses = taskService.getAllTasks();

        // THEN
        assertNotNull(responses);
        assertEquals(taskRecords, responses);
        verify(taskRepository, times(1)).findAll();
    }

    /**
     * Tests {@link TaskService#getAllTasks()} when retrieval fails.
     *
     * @return Throws RuntimeException on failure.
     */
    @Test
    public void testGetAllTasks_Failure() {
        // GIVEN
        when(taskRepository.findAll()).thenThrow(new RuntimeException("Database error"));

        // WHEN & THEN
        assertThrows(RuntimeException.class, () -> taskService.getAllTasks());
        verify(taskRepository, times(1)).findAll();
    }


    /**  ------------------------------------------------------------------------
     *   TaskService.getIncompleteTasks
     *   ------------------------------------------------------------------------ **/

    /**
     * Tests {@link TaskService#getIncompleteTasks()} for successful retrieval of incomplete tasks.
     *
     * @return A list of incomplete task records.
     */
    @Test
    public void testGetIncompleteTasks_Success() {
        // GIVEN
        List<TaskRecord> taskRecords = new ArrayList<>();
        TaskRecord incompleteTaskRecord = new TaskRecord();
        incompleteTaskRecord.setTaskId("incomplete-task-id");
        incompleteTaskRecord.setStatus("incomplete");
        taskRecords.add(incompleteTaskRecord);

        TaskResponse taskResponse = new TaskResponse();
        taskResponse.setTaskId("incomplete-task-id");
        taskResponse.setStatus("incomplete");

        // Mocking repository and converter behavior
        when(taskRepository.findByStatusNot("Completed")).thenReturn(taskRecords);
        when(taskConverter.fromRecordToResponse(incompleteTaskRecord)).thenReturn(taskResponse);

        // WHEN
        List<TaskRecord> responses = taskService.getIncompleteTasks();

        // THEN
        assertNotNull(responses);
        assertEquals(taskRecords, responses);
        verify(taskRepository, times(1)).findByStatusNot("Completed");
    }

    /**
     * Tests {@link TaskService#getIncompleteTasks()} when retrieval fails.
     *
     * @return Throws RuntimeException on failure.
     */
    @Test
    public void testGetIncompleteTasks_Failure() {
        // GIVEN
        when(taskRepository.findByStatusNot("Completed")).thenThrow(new RuntimeException("Database error"));

        // WHEN & THEN
        assertThrows(RuntimeException.class, () -> taskService.getIncompleteTasks());
        verify(taskRepository, times(1)).findByStatusNot("Completed");
    }


    /**  ------------------------------------------------------------------------
     *   TaskService.getCompletedTasks
     *   ------------------------------------------------------------------------ **/

    /**
     * Tests {@link TaskService#getCompletedTasks()} for successful retrieval of completed tasks.
     *
     * @return A list of completed task records.
     */
    @Test
    public void testGetCompletedTasks_Success() {
        // GIVEN
        List<TaskRecord> taskRecords = new ArrayList<>();
        TaskRecord completeTaskRecord = new TaskRecord();
        completeTaskRecord.setTaskId("completed-task-id");
        completeTaskRecord.setStatus("completed");
        taskRecords.add(completeTaskRecord);

        TaskResponse taskResponse = new TaskResponse();
        taskResponse.setTaskId("completed-task-id");
        taskResponse.setStatus("completed");

        when(taskRepository.findByStatus("Completed")).thenReturn(taskRecords);
        when(taskConverter.fromRecordToResponse(completeTaskRecord)).thenReturn(taskResponse);

        // WHEN
        List<TaskRecord> responses = taskService.getCompletedTasks();

        // THEN
        assertEquals(taskRecords, responses);
        verify(taskRepository, times(1)).findByStatus("Completed");
    }

    /**
     * Tests {@link TaskService#getCompletedTasks()} when retrieval fails.
     *
     * @return Throws RuntimeException on failure.
     */
    @Test
    public void testGetCompletedTasks_Failure() {
        // GIVEN
        when(taskRepository.findByStatus("Completed")).thenThrow(new RuntimeException("Database error"));

        // WHEN & THEN
        assertThrows(RuntimeException.class, () -> taskService.getCompletedTasks());
        verify(taskRepository, times(1)).findByStatus("Completed");
    }


    /**  ------------------------------------------------------------------------
     *   TaskService.updateTask
     *   ------------------------------------------------------------------------ **/

    /**
     * Tests {@link TaskService#updateTask(String, TaskRequest)} for successful task update.
     *
     * @param "taskId" The ID of the task to update.
     * @param "taskRequest" The request object with updated task details.
     * @return The updated task record.
     */
    @Test
    public void testUpdateTask_Success() {
        // GIVEN
        String taskId = "sample-task-id";
        TaskRequest taskRequest = new TaskRequest();
        taskRequest.setTitle("Updated Task");
        taskRequest.setDescription("Updated Description");
        taskRequest.setAssignedTo("New Assignee");
        taskRequest.setStatus("In Progress");
        taskRequest.setPriority("High");
        taskRequest.setTaskDueDate(LocalDate.now().plusDays(5).toString());

        TaskRecord existingTaskRecord = new TaskRecord();
        existingTaskRecord.setTaskId(taskId);
        existingTaskRecord.setTitle("Old Task");
        existingTaskRecord.setDescription("Old Description");
        existingTaskRecord.setAssignedTo("Old Assignee");
        existingTaskRecord.setStatus("Pending");
        existingTaskRecord.setPriority("Low");
        existingTaskRecord.setTaskDueDate(LocalDate.now().minusDays(1).toString());

        TaskRecord updatedTaskRecord = new TaskRecord();
        updatedTaskRecord.setTaskId(taskId);
        updatedTaskRecord.setTitle("Updated Task");
        updatedTaskRecord.setDescription("Updated Description");
        updatedTaskRecord.setAssignedTo("New Assignee");
        updatedTaskRecord.setStatus("In Progress");
        updatedTaskRecord.setPriority("High");
        updatedTaskRecord.setTaskDueDate(LocalDate.now().plusDays(5).toString());

        // Mocking interactions
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(existingTaskRecord));
        when(taskConverter.fromRequestToRecord(taskRequest)).thenReturn(updatedTaskRecord);
        when(taskRepository.save(updatedTaskRecord)).thenReturn(updatedTaskRecord);
        when(taskConverter.fromRecordToTaskData(updatedTaskRecord)).thenReturn(new TaskData());

        // WHEN
        TaskRecord response = taskService.updateTask(taskId, taskRequest);

        // THEN
        assertNotNull(response);
        assertEquals(taskId, response.getTaskId());
        assertEquals("Updated Task", response.getTitle());
        assertEquals("Updated Description", response.getDescription());
        assertEquals("New Assignee", response.getAssignedTo());
        assertEquals("In Progress", response.getStatus());
        assertEquals("High", response.getPriority());
        verify(taskRepository, times(1)).findById(taskId);
        verify(cache, times(1)).add(taskId, updatedTaskRecord);
        verify(taskRepository, times(1)).save(updatedTaskRecord);
    }

    /**
     * Tests {@link TaskService#updateTask(String, TaskRequest)} when task to update is not found.
     *
     * @param "taskId" The ID of the task to update (non-existent in this case).
     * @param "taskRequest" The request object with updated task details.
     * @return Throws TaskNotFoundException.
     */
    @Test
    public void testUpdateTask_Failure() {
        // GIVEN
        String taskId = "non-existent-task-id";
        TaskRequest taskRequest = new TaskRequest();
        taskRequest.setTitle("Updated Task");
        taskRequest.setDescription("Updated Description");
        taskRequest.setAssignedTo("New Assignee");
        taskRequest.setStatus("In Progress");
        taskRequest.setPriority("High");
        taskRequest.setTaskDueDate(LocalDate.now().plusDays(5).toString());

        when(taskRepository.findById(taskId)).thenReturn(Optional.empty());

        // WHEN & THEN
        assertThrows(IllegalArgumentException.class, () -> taskService.updateTask(taskId, taskRequest));
    }

    /**
     * Tests {@link TaskService#updateTask(String, TaskRequest)} when taskId is null.
     *
     * @param "taskId" The ID of the task to update (null in this case).
     * @param "taskRequest" The request object with updated task details.
     * @return Throws IllegalArgumentException.
     */
    @Test
    public void testUpdateTask_nullId_throwsException() {
        // GIVEN
        TaskRequest taskRequest = new TaskRequest();
        taskRequest.setTitle("Updated Task");
        taskRequest.setDescription("Updated Description");
        taskRequest.setAssignedTo("New Assignee");
        taskRequest.setStatus("In Progress");
        taskRequest.setPriority("High");
        taskRequest.setTaskDueDate(LocalDate.now().plusDays(5).toString());

        // WHEN & THEN
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> taskService.updateTask(null, taskRequest));

        assertEquals("Task ID cannot be null or empty", exception.getMessage());
    }



    /**  ------------------------------------------------------------------------
     *   TaskService.deleteTask
     *   ------------------------------------------------------------------------ **/

    /**
     * Tests {@link TaskService#deleteTask(String)} for successful task deletion.
     *
     * @param "taskId" The ID of the task to delete.
     * @return The deleted task record.
     */
    @Test
    public void testDeleteTask_Success() {
        // GIVEN
        String taskId = UUID.randomUUID().toString();
        TaskRecord existingTaskRecord = new TaskRecord();
        existingTaskRecord.setTaskId(taskId);

        // Mocking the repository and cache interactions
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(existingTaskRecord));
        doNothing().when(taskRepository).deleteById(taskId);
        when(lambdaServiceClient.deleteTask(taskId)).thenReturn(true);

        // WHEN
        TaskRecord response = taskService.deleteTask(taskId);

        // THEN
        assertNotNull(response);
        assertEquals(taskId, response.getTaskId());
        verify(taskRepository, times(1)).findById(taskId);
        verify(taskRepository, times(1)).deleteById(taskId);
        verify(cache, times(1)).evict(taskId);
        verify(lambdaServiceClient, times(1)).deleteTask(taskId);
    }

    /**
     * Tests {@link TaskService#deleteTask(String)} when task to delete is not found.
     *
     * @param "taskId" The ID of the task to delete (non-existent in this case).
     * @return Throws TaskNotFoundException.
     */
    @Test
    public void testDeleteTask_Failure() {
        // GIVEN
        String taskId = "non-existent-task-id";
        when(taskRepository.findById(taskId)).thenReturn(Optional.empty());

        // WHEN & THEN
        assertThrows(IllegalArgumentException.class, () -> taskService.deleteTask(taskId));
    }

    /**
     * Tests {@link TaskService#deleteTask(String)} when taskId is null.
     *
     * @param "taskId" The ID of the task to delete (null in this case).
     * @return Throws IllegalArgumentException.
     */
    @Test
    public void testDeleteTask_nullId_throwsException() {
        // GIVEN
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> taskService.deleteTask(null));

        // WHEN / THEN
        assertEquals("Task ID cannot be null or empty", exception.getMessage());
    }
}
