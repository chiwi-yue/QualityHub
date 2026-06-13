import { type Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('http://localhost:3001');
  }

  async login(username: string, password: string) {
    await this.page.getByTestId('username-input').fill(username);
    await this.page.getByTestId('password-input').fill(password);
    await this.page.getByTestId('login-btn').click();
  }

  async register(username: string, password: string) {
    await this.page.getByTestId('username-input').fill(username);
    await this.page.getByTestId('password-input').fill(password);
    await this.page.getByTestId('register-btn').click();
  }

  authError() {
    return this.page.getByTestId('auth-error');
  }
}
