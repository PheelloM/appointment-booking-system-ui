import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Message {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  content: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  private autoRemoveTimeout = 5000; // 5 seconds

  showSuccess(content: string, title?: string, duration?: number): void {
    this.addMessage({
      type: 'success',
      title,
      content,
      duration: duration || this.autoRemoveTimeout
    });
  }

  showError(content: string, title?: string, duration?: number): void {
    this.addMessage({
      type: 'error',
      title: title || 'Error',
      content,
      duration: duration || this.autoRemoveTimeout
    });
  }

  showWarning(content: string, title?: string, duration?: number): void {
    this.addMessage({
      type: 'warning',
      title,
      content,
      duration: duration || this.autoRemoveTimeout
    });
  }

  showInfo(content: string, title?: string, duration?: number): void {
    this.addMessage({
      type: 'info',
      title,
      content,
      duration: duration || this.autoRemoveTimeout
    });
  }

  clearMessages(): void {
    this.messagesSubject.next([]);
  }

  removeMessage(message: Message): void {
    const currentMessages = this.messagesSubject.value;
    const filteredMessages = currentMessages.filter(m => m !== message);
    this.messagesSubject.next(filteredMessages);
  }

  private addMessage(message: Message): void {
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, message]);

    // Auto-remove after duration
    if (message.duration) {
      setTimeout(() => {
        this.removeMessage(message);
      }, message.duration);
    }
  }
}
