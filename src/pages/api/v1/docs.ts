import type { APIRoute } from 'astro';
import { jsonResponse } from '../../../lib/security/headers';

export const prerender = false;

export const GET: APIRoute = async () => {
  const openApiSpec = {
    openapi: '3.0.3',
    info: {
      title: 'Welfare Hospital REST API',
      version: '1.0.0',
      description: 'Production Healthcare API for Welfare Hospital, 100 Feet Road, Ram Bagh, Agra',
      contact: {
        name: 'Welfare Hospital Reception Desk',
        phone: '+91 8490068558',
      },
    },
    servers: [
      { url: '/api/v1', description: 'Production API Endpoint' },
    ],
    paths: {
      '/health': {
        get: {
          summary: 'Service health check',
          responses: { '200': { description: 'Service operational' } },
        },
      },
      '/services': {
        get: {
          summary: 'List verified medical services',
          responses: { '200': { description: 'Array of services' } },
        },
      },
      '/doctors': {
        get: {
          summary: 'List verified doctors and supervising physicians',
          responses: { '200': { description: 'Array of doctors' } },
        },
      },
      '/appointments': {
        post: {
          summary: 'Submit outpatient appointment request',
          responses: {
            '201': { description: 'Appointment successfully created' },
            '400': { description: 'Validation error' },
            '429': { description: 'Rate limit exceeded' },
          },
        },
      },
      '/appointments/reference/{reference}': {
        get: {
          summary: 'Public appointment status tracking by reference',
          parameters: [{ name: 'reference', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Appointment status' },
            '404': { description: 'Appointment reference not found' },
          },
        },
      },
      '/auth/login': {
        post: {
          summary: 'Admin user authentication',
          responses: { '200': { description: 'JWT token and user info' } },
        },
      },
      '/admin/dashboard': {
        get: {
          summary: 'Administrative metrics overview',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Operational dashboard metrics' } },
        },
      },
      '/admin/appointments': {
        get: {
          summary: 'Paginated appointment management list',
          security: [{ bearerAuth: [] }],
          responses: { '200': { description: 'Filtered appointments' } },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  };

  return jsonResponse(openApiSpec);
};
