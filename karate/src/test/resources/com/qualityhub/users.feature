Feature: JSONPlaceholder Users API

  Background:
    * url 'https://jsonplaceholder.typicode.com'

  Scenario: GET /users returns 10 users with full schema
    Given path '/users'
    When method GET
    Then status 200
    And match response == '#[10]'
    And match each response ==
      """
      {
        id:       '#number',
        name:     '#string',
        username: '#string',
        email:    '#string',
        phone:    '#string',
        website:  '#string',
        address:  { street: '#string', suite: '#string', city: '#string', zipcode: '#string', geo: { lat: '#string', lng: '#string' } },
        company:  { name: '#string', catchPhrase: '#string', bs: '#string' }
      }
      """

  Scenario: GET /users/1 returns expected user details
    Given path '/users/1'
    When method GET
    Then status 200
    And match response.id == 1
    And match response.name == 'Leanne Graham'
    And match response.email == 'Sincere@april.biz'
    And match response.address.city == 'Gwenborough'

  Scenario: GET /users/999 returns 404 for non-existent user
    Given path '/users/999'
    When method GET
    Then status 404
