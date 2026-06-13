import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { TasksPage } from './pages/TasksPage';

// Each test registers its own user so in-memory state never collides
function uniqueUser() {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

test.describe('Task Manager', () => {
  let loginPage: LoginPage;
  let tasksPage: TasksPage;
  let testUser: string;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    tasksPage = new TasksPage(page);
    testUser = uniqueUser();
    await loginPage.goto();
    await loginPage.register(testUser, 'Password123');
  });

  test('register and land on tasks view', async () => {
    await expect(tasksPage.loggedInUser()).toContainText(testUser);
  });

  test('add a task', async () => {
    await tasksPage.addTask('Write API tests');
    await expect(tasksPage.taskItems()).toHaveCount(1);
    await expect(tasksPage.taskTitles().first()).toHaveText('Write API tests');
  });

  test('add multiple tasks', async () => {
    await tasksPage.addTask('First');
    await tasksPage.addTask('Second');
    await tasksPage.addTask('Third');
    await expect(tasksPage.taskItems()).toHaveCount(3);
  });

  test('delete a task', async () => {
    await tasksPage.addTask('To be deleted');
    await tasksPage.addTask('To stay');
    await tasksPage.deleteTask(0);
    await expect(tasksPage.taskItems()).toHaveCount(1);
    await expect(tasksPage.taskTitles().first()).toHaveText('To stay');
  });

  test('complete a task marks it visually', async ({ page }) => {
    await tasksPage.addTask('Finish the report');
    await tasksPage.completeTask(0);
    await expect(tasksPage.taskItems().first()).toHaveClass(/completed/);
  });

  test('invalid login shows error', async () => {
    await tasksPage.logout();
    await loginPage.login('nobody', 'wrongpass');
    await expect(loginPage.authError()).toContainText('Invalid credentials');
  });

  test('logout returns to login screen', async ({ page }) => {
    await tasksPage.logout();
    await expect(page.getByTestId('login-btn')).toBeVisible();
  });
});
