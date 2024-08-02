package com.kenzie.capstone.service.dao;

import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBMapper;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBSaveExpression;
import com.amazonaws.services.dynamodbv2.model.AttributeValue;
import com.amazonaws.services.dynamodbv2.model.ConditionalCheckFailedException;
import com.amazonaws.services.dynamodbv2.model.ExpectedAttributeValue;
import com.google.common.collect.ImmutableMap;
import com.kenzie.capstone.service.model.DataRecord;

/**
 * Data Access Object for performing operations on task data in DynamoDB.
 */
public class TaskDao {

    private final DynamoDBMapper mapper;

    /**
     * Constructor to initialize TaskDao with a DynamoDBMapper.
     *
     * @param mapper The DynamoDBMapper instance.
     */
    public TaskDao(DynamoDBMapper mapper) {
        this.mapper = mapper;
    }


    /**
     * Retrieves a task record by its ID.
     *
     * @param taskId The ID of the task to retrieve.
     * @return The DataRecord for the task.
     */
    public DataRecord getTaskData(String taskId) {
        return mapper.load(DataRecord.class, taskId);
    }


    /**
     * Creates a new task record.
     *
     * @param dataRecord The DataRecord to save.
     * @throws IllegalArgumentException if the task ID already exists.
     */
    public void createTaskData(DataRecord dataRecord) {
        try {
            mapper.save(dataRecord, new DynamoDBSaveExpression()
                    .withExpected(ImmutableMap.of(
                            "taskId", new ExpectedAttributeValue().withExists(false)
                    )));
        } catch (ConditionalCheckFailedException e) {
            throw new IllegalArgumentException("Task ID has already been used");
        }
    }


    /**
     * Updates an existing task record.
     *
     * @param dataRecord The DataRecord to update.
     * @return The updated DataRecord.
     * @throws IllegalArgumentException if the task ID does not exist.
     */
    public DataRecord updateTaskData(DataRecord dataRecord) {
        try {
            mapper.save(dataRecord, new DynamoDBSaveExpression()
                    .withExpected(ImmutableMap.of(
                            "taskId", new ExpectedAttributeValue().withExists(true).withValue(new AttributeValue(dataRecord.getTaskId()))
                    )));
            return dataRecord;
        } catch (ConditionalCheckFailedException e) {
            throw new IllegalArgumentException("Task ID does not exist");
        }
    }


    /**
     * Deletes a task record by its ID.
     *
     * @param taskId The ID of the task to delete.
     */
    public boolean deleteTaskData(String taskId) {

        DataRecord dataRecord = getTaskData(taskId);
        if (dataRecord == null) {
            return false;
        }
        mapper.delete(dataRecord);
        return true;
    }
}
