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
import com.kenzie.capstone.service.model.TaskData;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class CreateTaskLambda implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    static final Logger log = LogManager.getLogger();

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent input, Context context) {
        Gson gson = new GsonBuilder().create();
        log.info(gson.toJson(input));

        ServiceComponent serviceComponent = DaggerServiceComponent.create();
        LambdaService lambdaService = serviceComponent.provideLambdaService();

        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();

        try {
            TaskData request = gson.fromJson(input.getBody(), TaskData.class);

            if (request == null || request.getTaskId() == null || request.getTaskId().isEmpty()) {
                throw new InvalidDataException("Task ID must be provided");
            }

            lambdaService.createNewTask(request);
            String output = gson.toJson(request);

            return response
                    .withStatusCode(201)
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
