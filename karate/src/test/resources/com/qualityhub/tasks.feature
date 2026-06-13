Feature: Task API — auth + CRUD lifecycle

  Background:
    * url 'http://localhost:3001'
    # Unique username per run so in-memory state never collides
    * def username = 'karate_' + java.util.UUID.randomUUID().toString().substring(0, 8)
    * def password = 'KaratePass1'

  Scenario: Register a new user and receive a JWT
    Given path '/api/auth/register'
    And request { username: '#(username)', password: '#(password)' }
    When method POST
    Then status 201
    And match response.token == '#string'

  Scenario: Login with valid credentials returns a JWT
    # Register first
    Given path '/api/auth/register'
    And request { username: '#(username)', password: '#(password)' }
    When method POST
    Then status 201
    # Login
    Given path '/api/auth/login'
    And request { username: '#(username)', password: '#(password)' }
    When method POST
    Then status 200
    And match response.token == '#string'

  Scenario: Full task lifecycle — create, read, update, delete
    # Register and capture token
    Given path '/api/auth/register'
    And request { username: '#(username)', password: '#(password)' }
    When method POST
    Then status 201
    * def token = response.token

    # Create task
    Given path '/api/tasks'
    And header Authorization = 'Bearer ' + token
    And request { title: 'Write Karate tests' }
    When method POST
    Then status 201
    And match response == { id: '#number', title: 'Write Karate tests', completed: false, username: '#string' }
    * def taskId = response.id

    # Read tasks list
    Given path '/api/tasks'
    And header Authorization = 'Bearer ' + token
    When method GET
    Then status 200
    And match response[0].id == taskId
    And match response[0].title == 'Write Karate tests'

    # Update task
    Given path '/api/tasks/' + taskId
    And header Authorization = 'Bearer ' + token
    And request { title: 'Write Karate tests', completed: true }
    When method PUT
    Then status 200
    And match response.completed == true

    # Delete task
    Given path '/api/tasks/' + taskId
    And header Authorization = 'Bearer ' + token
    When method DELETE
    Then status 204

    # Verify deletion
    Given path '/api/tasks'
    And header Authorization = 'Bearer ' + token
    When method GET
    Then status 200
    And match response == []

  Scenario: Unauthenticated request returns 401
    Given path '/api/tasks'
    When method GET
    Then status 401

  Scenario: Login with wrong password returns 401
    Given path '/api/auth/register'
    And request { username: '#(username)', password: '#(password)' }
    When method POST
    Then status 201
    Given path '/api/auth/login'
    And request { username: '#(username)', password: 'wrongpassword' }
    When method POST
    Then status 401
    And match response.error == 'Invalid credentials'

  Scenario: Create task without title returns 400
    Given path '/api/auth/register'
    And request { username: '#(username)', password: '#(password)' }
    When method POST
    Then status 201
    * def token = response.token
    Given path '/api/tasks'
    And header Authorization = 'Bearer ' + token
    And request { }
    When method POST
    Then status 400
    And match response.error == 'title is required'
