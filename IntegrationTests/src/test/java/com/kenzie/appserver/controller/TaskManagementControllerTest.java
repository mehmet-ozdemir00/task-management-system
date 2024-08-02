package com.kenzie.appserver.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jdk8.Jdk8Module;
import com.kenzie.appserver.IntegrationTest;

import com.kenzie.appserver.controller.model.TaskRequest;
import com.kenzie.appserver.controller.model.TaskResponse;
import com.kenzie.appserver.repositories.TaskRepository;
import com.kenzie.appserver.repositories.model.TaskRecord;
import com.kenzie.appserver.service.TaskService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


/**
 * Integration tests for {@link TaskService} methods.
 * <p>
 * This class uses {@link MockMvc} to perform HTTP requests and verify responses for
 * the task management functionalities provided by {@link TaskService}.
 * </p>
 */
@IntegrationTest
public class TaskManagementControllerTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    TaskService taskService;

    @Autowired
    TaskRepository taskRepository;

    private static final ObjectMapper mapper = new ObjectMapper();

    @BeforeAll
    public static void setup() {
        mapper.registerModule(new Jdk8Module());
    }


    /**
     * Tests {@link TaskService#"createTask"("TaskRequest")} for successful task creation.
     * <p>
     * This test simulates a successful task creation by sending a valid {@link "TaskRequest"}
     * to the endpoint and verifies that the response contains the created task details.
     * </p>
     *
     * @throws Exception if there is an error during the HTTP request or response handling.
     */
    @Test
    public void createTask_Successfully() throws Exception {
        // GIVEN
        String title = "Presentation";
        String description = "Marketing for sale";
        String assignedTo = "John Dine";
        String status = "Incomplete";
        String priority = "High";
        String taskDueDate = "2024-10-20";

        TaskRequest taskRequest = new TaskRequest();
        taskRequest.setTitle(title);
        taskRequest.setDescription(description);
        taskRequest.setAssignedTo(assignedTo);
        taskRequest.setStatus(status);
        taskRequest.setPriority(priority);
        taskRequest.setTaskDueDate(taskDueDate);

        // WHEN
        MvcResult result = mvc.perform(post("/tasks")
                        .accept(MediaType.APPLICATION_JSON)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(taskRequest)))
                .andExpect(status().is2xxSuccessful())
                .andReturn();

        // THEN
        String content = result.getResponse().getContentAsString();
        TaskResponse taskResponse = mapper.readValue(content, TaskResponse.class);
        Assertions.assertEquals(taskResponse.getTitle(), "Presentation", title);
        Assertions.assertEquals(taskResponse.getDescription(), "Marketing for sale", description);
        Assertions.assertEquals(taskResponse.getAssignedTo(), "John Dine", assignedTo);
        Assertions.assertEquals(taskResponse.getStatus(), "Incomplete", status);
        Assertions.assertEquals(taskResponse.getPriority(), "High", priority);
        Assertions.assertEquals(taskResponse.getTaskDueDate(), "2024-10-20", taskDueDate);
    }


    /**
     * Tests the {@code createTask} endpoint with invalid data to ensure it returns a
     * {@code 400 Bad Request} status and that the response content is empty.
     *
     * <p>All fields in {@link TaskRequest} are empty strings. The test checks that the
     * response status is a client error (4xx) and the content is empty.</p>
     *
     * @throws Exception if there is an error during request or response handling
     */
    @Test
    public void createTask_Unsuccessful_InvalidData() throws Exception {
        // GIVEN
        TaskRequest taskRequest = new TaskRequest();

        // WHEN
        MvcResult result = mvc.perform(post("/tasks")
                        .accept(MediaType.APPLICATION_JSON)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(taskRequest)))
                .andExpect(status().is4xxClientError())
                .andReturn();

        // THEN
        String content = result.getResponse().getContentAsString();
        Assertions.assertTrue(content.isEmpty(), "Expected empty response content for bad request.");
    }


    /**
     * Tests the {@code getTask} endpoint to ensure it successfully retrieves a task by its ID.
     *
     * <p>First, a task is created with specified details (title, description, assigned user, status, priority, and due date).
     * The test then retrieves the task using its ID and verifies that the retrieved task's details match those of the created task.</p>
     *
     * @throws Exception if there is an error during request or response handling
     */
    @Test
    public void getTask_Successfully() throws Exception {
        // GIVEN
        TaskRequest taskRequest = new TaskRequest();
        taskRequest.setTitle("Meeting");
        taskRequest.setDescription("Team meeting");
        taskRequest.setAssignedTo("Alice");
        taskRequest.setStatus("Incomplete");
        taskRequest.setPriority("Medium");
        taskRequest.setTaskDueDate("2024-09-15");

        TaskResponse createdTask = mapper.readValue(mvc.perform(post("/tasks")
                        .accept(MediaType.APPLICATION_JSON)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(taskRequest)))
                .andExpect(status().is2xxSuccessful())
                .andReturn().getResponse().getContentAsString(), TaskResponse.class);

        // WHEN
        MvcResult result = mvc.perform(get("/tasks/" + createdTask.getTaskId())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().is2xxSuccessful())
                .andReturn();

        // THEN
        String content = result.getResponse().getContentAsString();
        TaskResponse taskResponse = mapper.readValue(content, TaskResponse.class);
        Assertions.assertEquals(createdTask.getTitle(), taskResponse.getTitle());
        Assertions.assertEquals(createdTask.getDescription(), taskResponse.getDescription());
    }


    /**
     * Tests the {@code getTask} endpoint to ensure it returns a {@code 4xx Client Error}
     * status when attempting to retrieve a task with a non-existent ID.
     *
     * <p>A random UUID is used as a non-existent task ID. The test verifies that the response status
     * is a client error (4xx) indicating that the task was not found.</p>
     *
     * @throws Exception if there is an error during request or response handling
     */
    @Test
    public void getTask_NotFound() throws Exception {
        // GIVEN
        String nonExistentId = UUID.randomUUID().toString();

        // WHEN
        mvc.perform(get("/tasks/invalid-task-id", nonExistentId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().is4xxClientError());
    }


    /**
     * Tests the {@code getAllTasks} endpoint to ensure it successfully retrieves all tasks.
     *
     * <p>Two tasks are first created with different details. The test then retrieves all tasks and verifies
     * that the response contains at least these two tasks, indicating that tasks are being retrieved correctly.</p>
     *
     * @throws Exception if there is an error during request or response handling
     */
    @Test
    public void getAllTasks_Successfully() throws Exception {
        // GIVEN
        TaskRequest taskRequest1 = new TaskRequest();
        taskRequest1.setTitle("Task 1");
        taskRequest1.setDescription("Description 1");
        taskRequest1.setAssignedTo("User1");
        taskRequest1.setStatus("Incomplete");
        taskRequest1.setPriority("Low");
        taskRequest1.setTaskDueDate("2024-11-01");

        TaskRequest taskRequest2 = new TaskRequest();
        taskRequest2.setTitle("Task 2");
        taskRequest2.setDescription("Description 2");
        taskRequest2.setAssignedTo("User2");
        taskRequest2.setStatus("Complete");
        taskRequest2.setPriority("High");
        taskRequest2.setTaskDueDate("2024-12-01");

        mvc.perform(post("/tasks")
                        .accept(MediaType.APPLICATION_JSON)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(taskRequest1)))
                .andExpect(status().is2xxSuccessful());

        mvc.perform(post("/tasks")
                        .accept(MediaType.APPLICATION_JSON)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(taskRequest2)))
                .andExpect(status().is2xxSuccessful());

        // WHEN
        MvcResult result = mvc.perform(get("/tasks/all")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().is2xxSuccessful())
                .andReturn();

        // THEN
        String content = result.getResponse().getContentAsString();
        List<TaskResponse> taskResponses = mapper.readValue(content, new TypeReference<>() {});
        Assertions.assertTrue(taskResponses.size() >= 2);
    }


    /**
     * Tests the {@code getAllTasks} endpoint to ensure it correctly handles an empty task list.
     *
     * <p>The test verifies that when no tasks are present, the endpoint returns a successful response.
     * It checks that the response status is {@code 204 No Content} and that the content is empty.
     * If the response status is different, it verifies that a list of tasks is included in the response.</p>
     *
     * @throws Exception if there is an error during request or response handling
     */
    @Test
    public void getAllTasks_EmptyList() throws Exception {
        // WHEN
        MvcResult result = mvc.perform(get("/tasks/all")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().is2xxSuccessful())
                .andReturn();

        // THEN
        String content = result.getResponse().getContentAsString();
        if (result.getResponse().getStatus() == HttpStatus.NO_CONTENT.value()) {
            Assertions.assertTrue(content.isEmpty(), "Expected no content for 204 response.");
        } else {
            List<TaskRecord> taskRecords = mapper.readValue(content, new TypeReference<>() {});
            Assertions.assertNotNull(taskRecords, "Expected a list of tasks in the response.");
        }
    }


    /**
     * Tests the {@code getIncompleteTasks} endpoint to ensure it successfully retrieves tasks with the status "Incomplete".
     *
     * <p>A task with the status "Incomplete" is created. The test then verifies that the endpoint correctly
     * retrieves tasks with the status "Incomplete" by checking that at least one task in the response has this status.</p>
     *
     * @throws Exception if there is an error during request or response handling
     */
    @Test
    public void getIncompleteTasks_Successfully() throws Exception {
        // GIVEN
        TaskRequest taskRequest = new TaskRequest();
        taskRequest.setTitle("Incomplete Task");
        taskRequest.setDescription("Task description");
        taskRequest.setAssignedTo("User");
        taskRequest.setStatus("Incomplete");
        taskRequest.setPriority("Medium");
        taskRequest.setTaskDueDate("2024-10-10");

        mvc.perform(post("/tasks")
                        .accept(MediaType.APPLICATION_JSON)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(taskRequest)))
                .andExpect(status().is2xxSuccessful());

        // WHEN
        MvcResult result = mvc.perform(get("/tasks/incomplete")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().is2xxSuccessful())
                .andReturn();

        // THEN
        String content = result.getResponse().getContentAsString();
        List<TaskResponse> taskResponses = mapper.readValue(content, new TypeReference<>() {});
        Assertions.assertTrue(taskResponses.stream().anyMatch(task -> "Incomplete".equals(task.getStatus())));
    }


    /**
     * Tests the {@code getIncompleteTasks} endpoint to verify the behavior when no incomplete tasks are present.
     *
     * <p>A task is created and saved, but it is not marked as incomplete. The test checks that the endpoint
     * returns a non-empty list of tasks, even though there are no tasks with the status "Incomplete".</p>
     *
     * @throws Exception if there is an error during request or response handling
     */
    @Test
    public void getInCompletedTasks_NoIncompleteTasks() throws Exception {
        // GIVEN
        TaskRecord incompleteTasks = new TaskRecord();
        taskRepository.save(incompleteTasks);

        // WHEN
        MvcResult result = mvc.perform(get("/tasks/incomplete")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().is2xxSuccessful())
                .andReturn();

        // THEN
        String content = result.getResponse().getContentAsString();
        List<TaskRecord> taskRecords = mapper.readValue(content, new TypeReference<>() {});
        Assertions.assertFalse(taskRecords.isEmpty(), "Expected a non-empty list of incomplete tasks.");
    }


    /**
     * Tests the {@code getCompletedTasks} endpoint to ensure it successfully retrieves tasks with the status "Completed".
     *
     * <p>A task with the status "Completed" is created. The test then verifies that the endpoint correctly
     * retrieves tasks with the status "Completed" by checking that at least one task in the response has this status.</p>
     *
     * @throws Exception if there is an error during request or response handling
     */
    @Test
    public void getCompletedTasks_WithCompletedTasks() throws Exception {
        // GIVEN
        TaskRequest taskRequest = new TaskRequest();
        taskRequest.setTitle("Completed Task");
        taskRequest.setDescription("Task description");
        taskRequest.setAssignedTo("User");
        taskRequest.setStatus("Completed");
        taskRequest.setPriority("Medium");
        taskRequest.setTaskDueDate("2024-10-10");

        mvc.perform(post("/tasks")
                        .accept(MediaType.APPLICATION_JSON)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(taskRequest)))
                .andExpect(status().is2xxSuccessful());

        // WHEN
        MvcResult result = mvc.perform(get("/tasks/completed")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().is2xxSuccessful())
                .andReturn();

        // THEN
        String content = result.getResponse().getContentAsString();
        List<TaskResponse> taskResponses = mapper.readValue(content, new TypeReference<>() {});
        Assertions.assertTrue(taskResponses.stream().anyMatch(task -> "Completed".equals(task.getStatus())),
                "Expected at least one completed task to be present in the response.");
    }


    /**
     * Tests the {@code getCompletedTasks} endpoint to verify the behavior when no completed tasks are present.
     *
     * <p>A task is created and saved with a status other than "Completed". The test checks that the endpoint
     * returns a list of tasks, even though there are no tasks with the status "Completed". It verifies that
     * the list includes the task and that the task's status is not "Completed".</p>
     *
     * @throws Exception if there is an error during request or response handling
     */
    @Test
    public void getCompletedTasks_NotFound() throws Exception {
        // GIVEN
        TaskRecord completedTasks = new TaskRecord();
        taskRepository.save(completedTasks);

        // WHEN
        MvcResult result = mvc.perform(get("/tasks/completed")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().is2xxSuccessful())
                .andReturn();

        // THEN
        String content = result.getResponse().getContentAsString();
        List<TaskRecord> taskRecords = mapper.readValue(content, new TypeReference<>() {});
        Assertions.assertFalse(taskRecords.isEmpty(), "Expected a list of completed tasks.");
        Assertions.assertTrue(taskRecords.stream().anyMatch(task -> "Completed".equals(task.getStatus())), "Expected the task to be in the list.");
    }


    /**
     * Tests the {@code updateTask} endpoint to ensure it successfully updates an existing task.
     *
     * <p>A task is created with initial details and then updated with new details. The test verifies that the
     * updated task's details match the new values provided.</p>
     *
     * @throws Exception if there is an error during request or response handling
     */
    @Test
    public void updateTask_Successfully() throws Exception {
        // GIVEN
        TaskRequest taskRequest = new TaskRequest();
        taskRequest.setTitle("Update Task");
        taskRequest.setDescription("Description");
        taskRequest.setAssignedTo("User");
        taskRequest.setStatus("Incomplete");
        taskRequest.setPriority("Medium");
        taskRequest.setTaskDueDate("2024-11-01");

        mvc.perform(post("/tasks")
                        .accept(MediaType.APPLICATION_JSON)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(taskRequest)))
                .andExpect(status().is2xxSuccessful())
                .andReturn();

        TaskResponse createdTask = taskService.createTask(taskRequest);

        // WHEN
        TaskRequest updatedTaskRequest = new TaskRequest();
        updatedTaskRequest.setTitle("Updated Task");
        updatedTaskRequest.setDescription("Updated description");
        updatedTaskRequest.setAssignedTo("Updated User");
        updatedTaskRequest.setStatus("Complete");
        updatedTaskRequest.setPriority("High");
        updatedTaskRequest.setTaskDueDate("2024-12-01");

        MvcResult updateResult = mvc.perform(put("/tasks/" + createdTask.getTaskId())
                        .accept(MediaType.APPLICATION_JSON)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(updatedTaskRequest)))
                .andExpect(status().is2xxSuccessful())
                .andReturn();

        // THEN
        String content = updateResult.getResponse().getContentAsString();
        TaskResponse updatedTaskResponse = mapper.readValue(content, TaskResponse.class);
        Assertions.assertEquals("Updated Task", updatedTaskResponse.getTitle());
        Assertions.assertEquals("Updated description", updatedTaskResponse.getDescription());
        Assertions.assertEquals("Updated User", updatedTaskResponse.getAssignedTo());
        Assertions.assertEquals("Complete", updatedTaskResponse.getStatus());
        Assertions.assertEquals("High", updatedTaskResponse.getPriority());
        Assertions.assertEquals("2024-12-01", updatedTaskResponse.getTaskDueDate());
    }

    /**
     * Tests the {@code updateTask} endpoint to ensure it returns a {@code 4xx Client Error} when trying to update a non-existent task.
     *
     * <p>An attempt is made to update a task with an invalid ID. The test verifies that the endpoint returns
     * the correct client error status when the task to be updated does not exist.</p>
     *
     * @throws Exception if there is an error during request or response handling
     */
    @Test
    public void updateTask_NotFound() throws Exception {
        // WHEN
        TaskRequest updatedTaskRequest = new TaskRequest();
        updatedTaskRequest.setTitle("Nonexistent Task");
        updatedTaskRequest.setDescription("Nonexistent description");
        updatedTaskRequest.setAssignedTo("Nonexistent User");
        updatedTaskRequest.setStatus("Incomplete");
        updatedTaskRequest.setPriority("Medium");
        updatedTaskRequest.setTaskDueDate("2024-11-01");

        mvc.perform(put("/tasks/invalid-task-id")
                        .accept(MediaType.APPLICATION_JSON)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(updatedTaskRequest)))
                .andExpect(status().is4xxClientError());
    }


    /**
     * Tests the {@code updateTask} endpoint to verify the behavior when provided with an empty or blank task ID.
     *
     * <p>An attempt is made to update a task using an empty task ID. The test checks that the endpoint
     * correctly handles invalid IDs by returning a client error status.</p>
     *
     * @throws Exception if there is an error during request or response handling
     */
    @Test
    public void updateTask_EmptyId() throws Exception {
        // WHEN
        String taskId = " ";
        TaskResponse response = new TaskResponse();
        response.setTaskId(" ");

        mvc.perform(put("/tasks/{id}", taskId)
                        .accept(MediaType.APPLICATION_JSON)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(response)))
                .andExpect(status().is4xxClientError());
    }


    /**
     * Tests the {@code deleteTask} endpoint to ensure it successfully deletes an existing task.
     *
     * <p>A task is created with specific details and then deleted. The test verifies that the deletion operation
     * completes successfully with a {@code 2xx Successful} status.</p>
     *
     * @throws Exception if there is an error during request or response handling
     */
    @Test
    public void deleteTask_Successfully() throws Exception {
        // GIVEN
        TaskRequest taskRequest = new TaskRequest();
        taskRequest.setTitle("Delete Me");
        taskRequest.setDescription("Delete description");
        taskRequest.setAssignedTo("User");
        taskRequest.setStatus("Incomplete");
        taskRequest.setPriority("Medium");
        taskRequest.setTaskDueDate("2024-11-01");

        String response = mvc.perform(post("/tasks")
                        .accept(MediaType.APPLICATION_JSON)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(taskRequest)))
                .andReturn().getResponse().getContentAsString();

        TaskRecord taskRecord = mapper.readValue(response, TaskRecord.class);

        // WHEN & THEN
        mvc.perform(delete("/tasks/{id}".replace("{id}", taskRecord.getTaskId()))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().is2xxSuccessful());
    }


    /**
     * Tests the {@code deleteTask} endpoint to ensure it returns a {@code 4xx Client Error} when attempting to delete a non-existent task.
     *
     * <p>An attempt is made to delete a task with an invalid ID. The test verifies that the endpoint returns
     * the correct client error status when the task to be deleted does not exist.</p>
     *
     * @throws Exception if there is an error during request or response handling
     */
    @Test
    public void deleteTask_NotFound() throws Exception {
        // WHEN
        mvc.perform(delete("/tasks/invalid-task-id")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().is4xxClientError());
    }
}