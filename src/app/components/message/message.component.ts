import { Component, OnInit } from '@angular/core';
import { MessageService, Message } from '../../services/message.service';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.css']
})
export class MessageComponent implements OnInit {
  messages: Message[] = [];

  constructor(private messageService: MessageService) {}

  ngOnInit(): void {
    this.messageService.messages$.subscribe(messages => {
      this.messages = messages;
    });
  }

  removeMessage(message: Message): void {
    this.messageService.removeMessage(message);
  }

  getMessageClass(message: Message): string {
    return `message-${message.type}`;
  }

  getMessageIcon(message: Message): string {
    switch (message.type) {
      case 'success': return '✓';
      case 'error': return '!';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return '';
    }
  }
}
