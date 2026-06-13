import { test, expect } from '@playwright/test';
import { TodoPage } from './pages/TodoPage';

test.describe('TodoMVC', () => {
  let todoPage: TodoPage;

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
    await todoPage.goto();
  });

  test('add a single todo', async () => {
    await todoPage.addTodo('Buy groceries');
    await expect(todoPage.todoItems()).toHaveCount(1);
    await expect(todoPage.todoItems().first()).toContainText('Buy groceries');
  });

  test('add multiple todos', async () => {
    await todoPage.addTodo('First task');
    await todoPage.addTodo('Second task');
    await todoPage.addTodo('Third task');
    await expect(todoPage.todoItems()).toHaveCount(3);
  });

  test('complete a todo and verify in Completed filter', async () => {
    await todoPage.addTodo('Write tests');
    await todoPage.addTodo('Deploy app');
    await todoPage.completeTodo(0);

    await todoPage.filterBy('Completed');
    await expect(todoPage.todoItems()).toHaveCount(1);
    await expect(todoPage.todoItems().first()).toContainText('Write tests');
  });

  test('clear completed todos', async () => {
    await todoPage.addTodo('Done item');
    await todoPage.addTodo('Pending item');
    await todoPage.completeTodo(0);
    await todoPage.clearCompleted();

    await expect(todoPage.todoItems()).toHaveCount(1);
    await expect(todoPage.todoItems().first()).toContainText('Pending item');
  });

  test('Active filter shows only incomplete todos', async () => {
    await todoPage.addTodo('Incomplete');
    await todoPage.addTodo('Complete me');
    await todoPage.completeTodo(1);

    await todoPage.filterBy('Active');
    await expect(todoPage.todoItems()).toHaveCount(1);
    await expect(todoPage.todoItems().first()).toContainText('Incomplete');
  });
});
