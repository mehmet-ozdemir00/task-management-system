package com.kenzie.capstone.service;

import com.kenzie.capstone.service.dao.TaskDao;
import com.kenzie.capstone.service.exceptions.InvalidDataException;
import com.kenzie.capstone.service.model.DataRecord;
import com.kenzie.capstone.service.model.TaskData;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;


/**
 * Tests for the {@link LambdaService} class.
 * This class contains unit tests for methods in the {@link LambdaService} class, ensuring
 * correct behavior for task operations such as getting, creating, updating, and deleting tasks.
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class TaskServiceTest {

    private TaskDao taskDao;
    private LambdaService lambdaService;

    @BeforeAll
    void setup() {
        this.taskDao = mock(TaskDao.class);
        this.lambdaService = new LambdaService(taskDao);
    }


    /**
     * Tests for {@link LambdaService#getTaskDetails(String)}.
     * This section contains tests for retrieving task details from the database.
    /*
     * Tests the retrieval of task details with a valid task ID.
     *
     * @param "taskId" The ID of the task to retrieve.
     * @return The {@link DataRecord} object corresponding to the task ID.
     * @throws InvalidDataException if the task ID is null or empty.
     */
    @Test
    void testGetTaskDetails_ValidId() {
        // GIVEN
        String taskId = "validTaskId";
        DataRecord dataRecord = new DataRecord();
        dataRecord.setTaskId(taskId);
        when(taskDao.getTaskData(taskId)).thenReturn(dataRecord);

        // WHEN
        DataRecord result = lambdaService.getTaskDetails(taskId);

        // THEN
        assertNotNull(result);
        assertEquals(taskId, result.getTaskId());
        verify(taskDao).getTaskData(taskId);
    }

    /**
     * Tests that an {@link InvalidDataException} is thrown when trying to retrieve task details
     * with an empty task ID.
     *
     * @param "taskId" The ID of the task to retrieve, which is an empty string in this case.
     * @throws InvalidDataException if the task ID is empty.
     */
    @Test
    void testGetTaskDetails_EmptyId_ThrowsInvalidDataException() {
        // GIVEN
        String taskId = "";

        // WHEN & THEN
        Exception exception = assertThrows(InvalidDataException.class, () -> lambdaService.getTaskDetails(taskId));

        assertEquals("Task ID must be provided", exception.getMessage());
        verify(taskDao, never()).getTaskData(anyString());
    }

    /**
     * Tests that null is returned when trying to retrieve details of a non-existing task.
     *
     * @param "nonExistingId" The ID of the task to retrieve, which does not exist in the database.
     * @return null if the task does not exist.
     */
    @Test
    void testGetTaskDetails_NonExistingId() {
        // GIVEN
        String nonExistingId = "non-existing-id";
        when(taskDao.getTaskData(nonExistingId)).thenReturn(null);

        // WHEN
        DataRecord result = lambdaService.getTaskDetails(nonExistingId);

        // THEN
        assertNull(result);
    }


    /**
     * Tests for {@link LambdaService#createNewTask(TaskData)}.
     * This section contains tests for creating new tasks in the database.
     *
    /**
     * Tests the creation of a new task with valid data.
     *
     * @param "taskData" The {@link TaskData} object containing the task details.
     * @return true if the task was successfully created.
     * @throws InvalidDataException if the task data is incomplete.
     */
    @Test
    void testCreateNewTask_ValidData() {
        // GIVEN
        TaskData taskData = new TaskData();
        taskData.setTaskId("validTaskId");
        taskData.setTaskTitle("Valid Task Title");
        taskData.setDescription("Valid Task Description");
        taskData.setDueDate(LocalDateTime.now().plusDays(1).toString());
        taskData.setStatus("Pending");

        // WHEN
        lambdaService.createNewTask(taskData);

        // THEN
        ArgumentCaptor<DataRecord> dataRecordCaptor = ArgumentCaptor.forClass(DataRecord.class);
        verify(taskDao).createTaskData(dataRecordCaptor.capture());
        DataRecord capturedDataRecord = dataRecordCaptor.getValue();

        assertEquals("validTaskId", capturedDataRecord.getTaskId());
        assertEquals("Valid Task Title", capturedDataRecord.getTaskTitle());
        assertEquals("Valid Task Description", capturedDataRecord.getDescription());
        assertEquals("Pending", capturedDataRecord.getStatus());
        assertNotNull(capturedDataRecord.getCreatedAt());
        assertNotNull(capturedDataRecord.getUpdatedAt());
    }


    /**
     * Tests that an {@link InvalidDataException} is thrown when trying to create a task
     * with missing fields.
     *
     * @param "taskData" The {@link TaskData} object with missing fields.
     * @throws InvalidDataException if required fields in the task data are missing.
     */
    @Test
    void testCreateNewTask_MissingFields_ThrowsInvalidDataException() {
        // GIVEN
        TaskData taskData = new TaskData();

        // WHEN & THEN
        Exception exception = assertThrows(InvalidDataException.class, () -> lambdaService.createNewTask(taskData));

        assertEquals("Task ID must be provided", exception.getMessage());
        verify(taskDao, never()).createTaskData(any(DataRecord.class));
    }



    /**
     * Tests for {@link LambdaService#updateExistingTask(String, TaskData)}.
     * This section contains tests for updating existing tasks in the database.
     *
    /**
     * Tests the update of an existing task with valid data.
     *
     * @param "taskId" The ID of the task to update.
     * @param "taskData" The {@link TaskData} object containing the updated task details.
     * @return The updated {@link TaskData} object.
     * @throws InvalidDataException if the task ID does not exist.
     */
    @Test
    void testUpdateExistingTask_ValidData() {
        // GIVEN
        String taskId = "existingTaskId";
        TaskData taskData = new TaskData();
        taskData.setTaskTitle("Updated Task");
        taskData.setDescription("Updated description");
        taskData.setAssignedTo("New Assignee");
        taskData.setStatus("Completed");

        DataRecord existingRecord = new DataRecord();
        existingRecord.setTaskId(taskId);
        when(taskDao.getTaskData(taskId)).thenReturn(existingRecord);
        when(taskDao.updateTaskData(any(DataRecord.class))).thenReturn(existingRecord);

        // WHEN
        TaskData updatedTaskData = lambdaService.updateExistingTask(taskId, taskData);

        // THEN
        assertNotNull(updatedTaskData);
        assertEquals("Updated Task", updatedTaskData.getTaskTitle());
        assertEquals("Updated description", updatedTaskData.getDescription());
        verify(taskDao).updateTaskData(any(DataRecord.class));
    }

    /**
     * Tests that an {@link InvalidDataException} is thrown when trying to update a task
     * with empty data.
     *
     * @param "taskId" The ID of the task to update.
     * @param "emptyData" The {@link TaskData} object with no updates.
     * @throws InvalidDataException if the task ID does not exist or the data is empty.
     */
    @Test
    void testUpdateExistingTask_EmptyData_ThrowsInvalidDataException() {
        // GIVEN
        String taskId = "existingTaskId";
        TaskData emptyData = new TaskData();

        // WHEN & THEN
        InvalidDataException exception = assertThrows(InvalidDataException.class, () -> lambdaService.updateExistingTask(taskId, emptyData));
        assertEquals("Task ID does not exist", exception.getMessage());
        verify(taskDao, never()).updateTaskData(any(DataRecord.class));
    }

    /**
     * Tests that an {@link InvalidDataException} is thrown when trying to update a task
     * with a null task ID.
     *
     * @param "updatedData" The {@link TaskData} object with updated details.
     * @throws InvalidDataException if the task ID is null.
     */
    @Test
    void testUpdateExistingTask_NullId() {
        // GIVEN
        TaskData updatedData = new TaskData();

        // WHEN / THEN
        assertThrows(InvalidDataException.class, () -> lambdaService.updateExistingTask(null, updatedData));
        verify(taskDao, never()).updateTaskData(any());
    }

    /**
     * Tests that an {@link InvalidDataException} is thrown when trying to update a task
     * with a non-existing task ID.
     *
     * @param "nonExistingTaskId" The ID of the task to update, which does not exist in the database.
     * @param "taskData" The {@link TaskData} object with updated details.
     * @throws InvalidDataException if the task ID does not exist.
     */
    @Test
    void testUpdateExistingTask_NonExistingId_ThrowsInvalidDataException() {
        // GIVEN
        String nonExistingTaskId = "nonExistingTaskId";
        TaskData taskData = new TaskData();
        taskData.setTaskTitle("Updated Task");

        when(taskDao.getTaskData(nonExistingTaskId)).thenReturn(null);

        // WHEN & THEN
        Exception exception = assertThrows(InvalidDataException.class, () -> lambdaService.updateExistingTask(nonExistingTaskId, taskData));
        assertEquals("Task ID does not exist", exception.getMessage());
        verify(taskDao, never()).updateTaskData(any(DataRecord.class));
    }



    /**
     * Tests for {@link LambdaService#deleteTaskFromDatabase(String)}.
     * This section contains tests for deleting tasks from the database.
     *
    /*
     * Tests the deletion of a task from the database with a valid task ID.
     *
     * @param "taskId" The ID of the task to delete.
     * @return true if the task was successfully deleted.
     * @throws InvalidDataException if the task ID is null or empty.
     */
    @Test
    void testDeleteTaskFromDatabase_ValidId() {
        // GIVEN
        String taskId = "taskIdToDelete";
        when(taskDao.deleteTaskData(taskId)).thenReturn(true);

        // WHEN
        boolean result = lambdaService.deleteTaskFromDatabase(taskId);

        // THEN
        assertTrue(result);
        verify(taskDao).deleteTaskData(taskId);
    }

    /**
     * Tests the deletion of multiple tasks from the database.
     *
     * @param "taskIds" A list of task IDs to delete.
     * @return true if all tasks were successfully deleted.
     */
    @Test
    void testDeleteTaskFromDatabase_MultipleIds() {
        // GIVEN
        List<String> taskIds = Arrays.asList("id1", "id2", "id3");
        when(taskDao.deleteTaskData(anyString())).thenReturn(true);

        // WHEN
        boolean allDeleted = taskIds.stream().allMatch(lambdaService::deleteTaskFromDatabase);

        // THEN
        assertTrue(allDeleted);
        for (String taskId : taskIds) {
            verify(taskDao, times(1)).deleteTaskData(taskId);
        }
    }
}
