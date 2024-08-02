package com.kenzie.appserver.controller;

import com.kenzie.appserver.controller.model.TaskRequest;
import com.kenzie.appserver.controller.model.TaskResponse;
import com.kenzie.appserver.repositories.model.TaskRecord;
import com.kenzie.appserver.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.Valid;
import java.util.ArrayList;
import java.util.List;

/**
 * A REST controller for managing tasks within the application.
 * This class provides endpoints for creating, retrieving, updating,
 * and deleting tasks. It handles HTTP requests and responses, interacting
 * with the {@link TaskService} to perform operations on task data.
 *
 * <p>Endpoints:
 * <ul>
 *     <li>POST /tasks - Create a new task</li>
 *     <li>GET /tasks/{taskId} - Retrieve a specific task by ID</li>
 *     <li>GET /tasks/all - Retrieve all tasks</li>
 *     <li>GET /tasks/inCompleted - Retrieve all inCompleted tasks</li>
 *     <li>GET /tasks/completed - Retrieve all completed tasks</li>
 *     <li>PUT /tasks/{taskId} - Update an existing task by ID</li>
 *     <li>DELETE /tasks/{taskId} - Delete a task by ID</li>
 * </ul>
 */
@RestController
@RequestMapping("/tasks")
public class TaskController {

    private final TaskService taskService;

    @Autowired
    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping
    public ResponseEntity<TaskResponse> createTask(@Valid @RequestBody TaskRequest taskRequest) {

        try {
            TaskResponse createdTask = taskService.createTask(taskRequest);
            return ResponseEntity.ok(createdTask);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{taskId}")
    public ResponseEntity<TaskResponse> getTask(@PathVariable("taskId") String taskId) {

        try {
            TaskResponse response = taskService.getTask(taskId);
            if (response == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/all")
    public ResponseEntity<List<TaskRecord>> getAllTasks() {

        try {
            List<TaskRecord> tasks = taskService.getAllTasks();
            return ResponseEntity.ok(tasks);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.noContent().build();
        }
    }

    @GetMapping("/incomplete")
    public ResponseEntity<List<TaskRecord>> getIncompleteTasks() {

        try {
            List<TaskRecord> incompleteTasks = taskService.getIncompleteTasks();
            return ResponseEntity.ok(incompleteTasks);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.noContent().build();
        }
    }

    @GetMapping("/completed")
    public ResponseEntity<List<TaskRecord>> getCompletedTasks() {

        try {
            List<TaskRecord> completedTasks = taskService.getCompletedTasks();
            return ResponseEntity.ok(completedTasks);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.noContent().build();
        }
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<TaskRecord> updateTask(@PathVariable("taskId") String taskId, @RequestBody TaskRequest taskRequest) {
        if (taskId == null || taskId.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "ID cannot be null");
        }

        try {
            TaskRecord updatedTask = taskService.updateTask(taskId, taskRequest);
            return ResponseEntity.ok(updatedTask);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<TaskRecord> deleteTask(@PathVariable("taskId") String taskId) {
        if (taskId == null || taskId.isEmpty()) {
            throw new IllegalArgumentException("Task ID cannot be null or empty");
        }

        try {
            TaskRecord deletedTask = taskService.deleteTask(taskId);
            return ResponseEntity.ok(deletedTask);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
