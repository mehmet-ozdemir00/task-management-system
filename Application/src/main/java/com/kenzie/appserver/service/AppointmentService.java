package com.kenzie.appserver.service;

import com.kenzie.appserver.config.CacheStore;
import com.kenzie.appserver.controller.model.AppointmentCreateRequest;
import com.kenzie.appserver.controller.model.AppointmentResponse;
import com.kenzie.appserver.repositories.AppointmentRepository;
import com.kenzie.appserver.repositories.model.AppointmentRecord;
import com.kenzie.capstone.service.client.LambdaServiceClient;
import com.kenzie.capstone.service.model.BookingData;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final LambdaServiceClient lambdaServiceClient;
    private final CacheStore cache;

    public AppointmentService(AppointmentRepository appointmentRepository, LambdaServiceClient lambdaServiceClient, CacheStore cache) {
        this.appointmentRepository = appointmentRepository;
        this.lambdaServiceClient = lambdaServiceClient;
        this.cache = cache;
    }

    public AppointmentResponse createAppointment(AppointmentCreateRequest appointmentCreateRequest) {

        if (appointmentCreateRequest == null) {
            throw new IllegalArgumentException("AppointmentCreateRequest cannot be null");
        }

        // Generating the appointmentId
        String appointmentId = UUID.randomUUID().toString();

        // Creating the AppointmentRecord and Set the appointmentId
        AppointmentRecord record = fromRequestToRecord(appointmentCreateRequest);
        record.setAppointmentId(appointmentId);
        record.setBookingId(UUID.randomUUID().toString());

        // Saving the record to the repository
        appointmentRepository.save(record);

        // Notifying the Lambda service about the new appointment
        lambdaServiceClient.createBooking(fromRecordToBookingData(record));

        return fromRecordToResponse(record);
    }

    public AppointmentResponse getAppointmentById(String id) {

        if (id == null) {
            throw new IllegalArgumentException("Appointment ID cannot be null");
        }

        AppointmentRecord cachedRecord = cache.get(id);
        if (cachedRecord != null) {
            return fromRecordToResponse(cachedRecord);
        }

        AppointmentRecord recordFromBackendService = appointmentRepository
                .findById(id)
                .orElse(null);

        AppointmentResponse response = null;

        if (recordFromBackendService != null) {
            cache.add(recordFromBackendService.getAppointmentId(), recordFromBackendService);
            response = fromRecordToResponse(recordFromBackendService);
        }

        // Notifying the Lambda service about the appointment
        lambdaServiceClient.getBooking(id);
        return response;
    }

    public Iterable<AppointmentRecord> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    public AppointmentRecord updateAppointmentById(String appointmentId, AppointmentCreateRequest appointmentCreateRequest) {

        if (appointmentId == null) {
            throw new IllegalArgumentException("Appointment ID cannot be null");
        }

        Optional<AppointmentRecord> optionalRecord = appointmentRepository.findById(appointmentId);

        if (optionalRecord.isPresent()) {
            AppointmentRecord record = optionalRecord.get();
            record.setPatientFirstName(appointmentCreateRequest.getPatientFirstName());
            record.setPatientLastName(appointmentCreateRequest.getPatientLastName());
            record.setProviderName(appointmentCreateRequest.getProviderName());
            record.setGender(appointmentCreateRequest.getGender());
            record.setAppointmentDate(appointmentCreateRequest.getAppointmentDate());
            record.setAppointmentTime(appointmentCreateRequest.getAppointmentTime());

            AppointmentRecord updatedRecord = appointmentRepository.save(record);
            cache.evict(appointmentId);
            cache.add(record.getAppointmentId(), record);
            //BookingData data = lambdaServiceClient.getBooking(updatedRecord.getBookingId());

            // Notifying the Lambda service about the appointment update
            lambdaServiceClient.updateBooking(fromRecordToBookingData(updatedRecord));

            return updatedRecord;
        } else {
            throw new IllegalArgumentException( "Appointment not found with id: " + appointmentId);
        }
    }

    public AppointmentRecord deleteAppointmentById(String id) {

        if (id == null) {
            throw new IllegalArgumentException("Appointment ID cannot be null");
        }

        // Retrieving the record before deletion
        AppointmentRecord deletedRecord = appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found for ID: " + id));

        // Deleting the record
        appointmentRepository.deleteById(id);
        cache.evict(id);

        // Notifying the Lambda service about the appointment deletion
        boolean deletionResult = lambdaServiceClient.deleteBooking(id);
        if (!deletionResult) {
            throw new RuntimeException("Failed to delete booking in Lambda service");
        }

        return deletedRecord;
    }


    /**  ------------------------------------------------------------------------
     *   Private Methods
     *   ------------------------------------------------------------------------ **/

    private AppointmentRecord fromRequestToRecord(AppointmentCreateRequest appointmentCreateRequest) {

        AppointmentRecord record = new AppointmentRecord();
        record.setPatientFirstName(appointmentCreateRequest.getPatientFirstName());
        record.setPatientLastName(appointmentCreateRequest.getPatientLastName());
        record.setProviderName(appointmentCreateRequest.getProviderName());
        record.setGender(appointmentCreateRequest.getGender());
        record.setAppointmentDate(appointmentCreateRequest.getAppointmentDate());
        record.setAppointmentTime(appointmentCreateRequest.getAppointmentTime());
        return record;
    }

    private AppointmentResponse fromRecordToResponse(AppointmentRecord record) {

        AppointmentResponse response = new AppointmentResponse();
        response.setAppointmentId(record.getAppointmentId());
        response.setPatientFirstName(record.getPatientFirstName());
        response.setPatientLastName(record.getPatientLastName());
        response.setProviderName(record.getProviderName());
        response.setGender(record.getGender());
        response.setAppointmentDate(record.getAppointmentDate());
        response.setAppointmentTime(record.getAppointmentTime());
        return response;
    }

    private BookingData fromRecordToBookingData(AppointmentRecord record) {

        BookingData bookingData = new BookingData();
        bookingData.setBookingId(record.getBookingId());
        bookingData.setId(record.getAppointmentId());
        bookingData.setPatientName(record.getPatientFirstName());
        bookingData.setPatientLastName(record.getPatientLastName());
        bookingData.setProviderName(record.getProviderName());
        bookingData.setGender(record.getGender());
        bookingData.setAppointmentDate(record.getAppointmentDate());
        bookingData.setAppointmentTime(record.getAppointmentTime());
        return bookingData;
    }
}