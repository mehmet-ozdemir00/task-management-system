package com.kenzie.capstone.service.lambda;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.kenzie.capstone.service.LambdaService;
import com.kenzie.capstone.service.dependency.DaggerServiceComponent;
import com.kenzie.capstone.service.dependency.ServiceComponent;
import com.kenzie.capstone.service.exceptions.InvalidDataException;
import com.kenzie.capstone.service.model.DataRecord;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.HashMap;
import java.util.Map;

public class GetTaskLambda implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    static final Logger log = LogManager.getLogger();

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent input, Context context) {
        Gson gson = new GsonBuilder().create();
        log.info(gson.toJson(input));

        ServiceComponent serviceComponent = DaggerServiceComponent.create();
        LambdaService lambdaService = serviceComponent.provideLambdaService();
        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application/json");

        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent().withHeaders(headers);
        String taskId = input.getPathParameters().get("taskId");

        if (taskId == null || taskId.isEmpty()) {
            return response
                    .withStatusCode(400)
                    .withBody("TaskID is invalid");
        }

        try {
            DataRecord record = lambdaService.getTaskDetails(taskId);
            String output = gson.toJson(record);
            return response
                    .withStatusCode(200)
                    .withBody(output);
        } catch (InvalidDataException e) {
            log.error("Invalid Data Exception: " + e.getMessage(), e);
            return response
                    .withStatusCode(400)
                    .withBody(gson.toJson(e.errorPayload()));
        } catch (Exception e) {
            log.error("Unhandled Exception: " + e.getMessage(), e);
            return response
                    .withStatusCode(500)
                    .withBody("Internal Server Error");
        }
    }
}