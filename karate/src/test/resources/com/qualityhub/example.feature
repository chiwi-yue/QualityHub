Feature: JSONPlaceholder API smoke tests

  Background:
    * url 'https://jsonplaceholder.typicode.com'

  Scenario: GET /posts returns a list
    Given path '/posts'
    When method GET
    Then status 200
    And match response == '#[]'
    And match response[0] == { userId: '#number', id: '#number', title: '#string', body: '#string' }

  Scenario: POST /posts creates a resource
    Given path '/posts'
    And request { title: 'QualityHub', body: 'Testing with Karate', userId: 1 }
    When method POST
    Then status 201
    And match response.id == '#number'
