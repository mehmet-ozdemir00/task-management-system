package com.kenzie.appserver.repositories;

import com.kenzie.appserver.repositories.model.TaskRecord;
import org.socialsignin.spring.data.dynamodb.repository.EnableScan;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

/**
 * Repository interface for performing CRUD operations on {@link TaskRecord} entities.
 * This interface extends {@link CrudRepository} and includes methods to query tasks
 * based on their status, specifically for finding tasks by status or status not equal to
 * a specified value. The {@code @EnableScan} annotation enables scanning of DynamoDB tables
 * for the repository.
 */
@EnableScan
public interface TaskRepository extends CrudRepository<TaskRecord, String> {
    List<TaskRecord> findAll();
    List<TaskRecord> findByStatus(String status);
    List<TaskRecord> findByStatusNot(String status);
}
