import { type Page, type Locator } from '@playwright/test';

export class TodoPage {
  private readonly newTodoInput: Locator;

  constructor(private page: Page) {
    this.newTodoInput = page.getByPlaceholder('What needs to be done?');
  }

  async goto() {
    await this.page.goto('https://demo.playwright.dev/todomvc');
  }

  async addTodo(text: string) {
    await this.newTodoInput.fill(text);
    await this.newTodoInput.press('Enter');
  }

  todoItems() {
    return this.page.getByTestId('todo-item');
  }

  async completeTodo(index: number) {
    await this.todoItems().nth(index).getByRole('checkbox').check();
  }

  async filterBy(filter: 'All' | 'Active' | 'Completed') {
    await this.page.getByRole('link', { name: filter }).click();
  }

  async clearCompleted() {
    await this.page.getByRole('button', { name: 'Clear completed' }).click();
  }
}
