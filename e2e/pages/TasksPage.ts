import { type Page } from '@playwright/test';

export class TasksPage {
  constructor(private page: Page) {}

  async addTask(title: string) {
    await this.page.getByTestId('new-task-input').fill(title);
    const response = this.page.waitForResponse(r =>
      r.url().includes('/api/tasks') && r.request().method() === 'POST'
    );
    await this.page.getByTestId('add-task-btn').click();
    await response;
  }

  taskItems() {
    return this.page.getByTestId('task-item');
  }

  taskTitles() {
    return this.page.getByTestId('task-title');
  }

  async deleteTask(index: number) {
    const response = this.page.waitForResponse(r =>
      r.url().includes('/api/tasks') && r.request().method() === 'DELETE'
    );
    await this.taskItems().nth(index).getByTestId('delete-task-btn').click();
    await response;
  }

  async completeTask(index: number) {
    await this.taskItems().nth(index).getByTestId('task-checkbox').check();
  }

  loggedInUser() {
    return this.page.getByTestId('logged-in-user');
  }

  async logout() {
    await this.page.getByTestId('logout-btn').click();
  }
}
