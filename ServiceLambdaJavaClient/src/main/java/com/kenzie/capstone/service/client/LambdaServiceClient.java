package com.kenzie.capstone.service.client;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kenzie.capstone.service.model.TaskData;

/**
 * Client for interacting with the Lambda service endpoints.
 * This class provides methods to create, retrieve, update, and delete tasks.
 */
public class LambdaServiceClient {

    private static final String CREATE_TASK_ENDPOINT = "task/create";
    private static final String GET_TASK_ENDPOINT = "task/{taskId}";
    private static final String UPDATE_TASK_ENDPOINT = "task/update/{taskId}";
    private static final String DELETE_TASK_ENDPOINT = "task/delete/{taskId}";

    private final ObjectMapper mapper;

    /**
     * Constructs a LambdaServiceClient instance.
     */
    public LambdaServiceClient() {
        this.mapper = new ObjectMapper();
    }


    /**
     * Creates a new task with the provided task data.
     *
     * @param taskData The data for the task to be created.
     * @throws ApiGatewayException If serialization or API call fails.
     */
    public void createTask(TaskData taskData) {
        EndpointUtility endpointUtility = new EndpointUtility();

        String request;
        try {
            request = mapper.writeValueAsString(taskData);
        } catch (JsonProcessingException e) {
            throw new ApiGatewayException("Unable to serialize request: " + e.getMessage());
        }

        String response = endpointUtility.postEndpoint(CREATE_TASK_ENDPOINT, request);
        try {
            mapper.readValue(response, TaskData.class);
        } catch (Exception e) {
            throw new ApiGatewayException("Unable to deserialize JSON: " + e.getMessage());
        }
    }


    /**
     * Retrieves a task by its ID.
     *
     * @param taskId The ID of the task to retrieve.
     * The task data corresponding to the provided ID.
     * @throws ApiGatewayException If API call or deserialization fails.
     */
    public void getTask(String taskId) {
        EndpointUtility endpointUtility = new EndpointUtility();

        String response = endpointUtility.getEndpoint(GET_TASK_ENDPOINT.replace("{taskId}", taskId));
        try {
            mapper.readValue(response, TaskData.class);
        } catch (Exception e) {
            throw new ApiGatewayException("Unable to deserialize JSON: " + e.getMessage());
        }
    }


    /**
     * Updates an existing task with the provided data.
     *
     * @param taskId The ID of the task to update.
     * @param taskData The updated data for the task.
     * The updated task data.
     * @throws ApiGatewayException If serialization or API call fails.
     */
    public void updateTask(String taskId, TaskData taskData) {
        EndpointUtility endpointUtility = new EndpointUtility();

        String request;
        try {
            request = mapper.writeValueAsString(taskData);
        } catch (JsonProcessingException e) {
            throw new ApiGatewayException("Unable to serialize request: " + e.getMessage());
        }

        String response;
        try {
            response = endpointUtility.postEndpoint(UPDATE_TASK_ENDPOINT.replace("{taskId}", taskId), request);
        } catch (Exception e) {
            throw new ApiGatewayException("Error while calling Lambda service: " + e.getMessage());
        }

        try {
            mapper.readValue(response, TaskData.class);
        } catch (Exception e) {
            throw new ApiGatewayException("Unable to deserialize response: " + e.getMessage());
        }
    }


    /**
     * Deletes a task by its ID.
     *
     * @param taskId The ID of the task to delete.
     * @return true if the deletion was successful, false otherwise.
     * @throws ApiGatewayException If serialization or API call fails.
     */
    public boolean deleteTask(String taskId) {
        EndpointUtility endpointUtility = new EndpointUtility();

        String request;
        try {
            request = mapper.writeValueAsString(taskId);
        } catch (JsonProcessingException e) {
            throw new ApiGatewayException("Unable to serialize request: " + e.getMessage());
        }

        String response = endpointUtility.postEndpoint(DELETE_TASK_ENDPOINT.replace("{taskId}", taskId), request);
        boolean outcome;
        try {
            outcome = mapper.readValue(response, Boolean.class);
        } catch (Exception e) {
            throw new ApiGatewayException("Unable to deserialize response: " + e.getMessage());
        }
        return outcome;
    }
}