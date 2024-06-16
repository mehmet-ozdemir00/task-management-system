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
import com.kenzie.capstone.service.model.BookingData;
import com.kenzie.capstone.service.model.BookingRecord;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import java.util.HashMap;
import java.util.Map;

public class UpdateBookingLambda implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

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

        try {
            String bookingId = input.getPathParameters().get("id");
            BookingData bookingData = gson.fromJson(input.getBody(), BookingData.class);
            BookingRecord updatedBooking = lambdaService.updateBooking(bookingId, bookingData);
            String output = gson.toJson(updatedBooking);

            return response.withStatusCode(200).withBody(output);

        } catch (Exception e) {
            return response.withStatusCode(400).withBody(gson.toJson(e.getMessage()));
        }
    }
}