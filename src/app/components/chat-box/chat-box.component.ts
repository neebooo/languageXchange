import { Store, select } from '@ngrx/store';
import { Observable, of, take } from 'rxjs';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { Clipboard } from '@capacitor/clipboard';
import {
  IonItemSliding,
  ModalController,
  ToastController,
} from '@ionic/angular';
import {
  Component,
  Input,
  OnInit,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';

import { MessageService } from 'src/app/services/chat/message.service';
import { PreviewPhotoComponent } from 'src/app/components/preview-photo/preview-photo.component';
import { messageTime } from 'src/app/extras/utils';
import { Message } from 'src/app/models/Message';
import { updateMessageSeenAction } from 'src/app/store/actions/message.action';
import { messagesSelector } from 'src/app/store/selectors/message.selector';

@Component({
  selector: 'app-chat-box',
  templateUrl: './chat-box.component.html',
  styleUrls: ['./chat-box.component.scss'],
})
export class ChatBoxComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('itemSlidingSender') itemSlidingSender: IonItemSliding;
  @ViewChild('itemSlidingReveiver') itemSlidingReveiver: IonItemSliding;

  @Input() chat: Message;
  @Input() current_user_id: string;
  @Output() onReply: EventEmitter<any> = new EventEmitter();

  private observer: IntersectionObserver;

  msg: Message = null;
  replyTo: string = null;
  replyToMessage$: Observable<Message>;

  audioRef: HTMLAudioElement = null;
  audioId: string = null;
  isDownloaded: boolean = false;

  constructor(
    private store: Store,
    private messageService: MessageService,
    private modalCtrl: ModalController,
    private toastController: ToastController,
    private el: ElementRef
  ) {}

  async ngOnInit() {
    await this.initValues();
  }

  ngAfterViewInit() {
    // This is for the seen action when the message is in view
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => this.handleIntersect(entry));
    });
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    this.observer.disconnect();
  }

  async initValues() {
    this.msg = { ...this.chat };

    // Check if the message has replyTo
    if (this.msg.replyTo) {
      // Set the replyTo message id
      this.replyTo = this.msg.replyTo;

      // Get the replyTo message
      this.store.pipe(select(messagesSelector), take(1)).subscribe((messages) => {
        const replyToMessage = messages ? messages.find((m) => m.$id === this.replyTo) : null;

        if (replyToMessage) {
          this.replyToMessage$ = of(replyToMessage);
        } else {
          this.replyToMessage$ = this.messageService.getMessageById(this.msg.replyTo);
        }
      });
    }

    // Check if the message is an audio
    if (this.msg.type === 'audio') {
      this.audioId = this.msg?.$id;
      await this.readFiles(this.msg?.$id);
    }
  }

  //
  // Utils for audio
  //

  private async readFiles(id: string) {
    try {
      const ret = await Filesystem.readFile({
        path: id,
        directory: Directory.Data,
      });
      this.audioRef = new Audio('data:audio/aac;base64,' + ret.data);
      this.isDownloaded = true;
    } catch (e) {
      // Download file from server
      this.downloadFile();
    }
  }

  // TODO : Download file from server logic
  async downloadFile() {
    const response = await fetch(this.msg?.audio);
    const blob = await response.blob();

    // Create a new FileReader instance
    const reader = new FileReader();

    const base64Audio = await new Promise((resolve) => {
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });

    // TODO: Take a look here to see if we can use the base64Audio directly
    const base64AudioString = base64Audio.toString();

    const fileName = this.msg.$id;
    await Filesystem.writeFile({
      path: fileName,
      data: base64AudioString,
      directory: Directory.Data,
    });

    console.log('Download complete');
    this.isDownloaded = true;
  }

  async play(fileName: string) {
    const audioFile = await Filesystem.readFile({
      path: fileName,
      directory: Directory.Data,
    });
    // console.log('Audio file', audioFile);
    const base64Sound = audioFile.data;
    // console.log('Base64 Audio:', base64Sound);

    // Play the audio file
    this.audioRef = new Audio(`data:audio/aac;base64,${base64Sound}`);
    this.audioRef.oncanplaythrough = () => {
      // console.log('Audio file duration', this.audioRef.duration);
    };
    this.audioRef.onended = () => {
      this.audioRef = null;
    };
    this.audioRef.load();
    return this.audioRef.play();
  }

  async stop() {
    if (this.audioRef) {
      this.audioRef.pause();
      this.audioRef.currentTime = 0;
    }
  }

  async togglePlayStop() {
    if (this.isPlaying()) {
      this.stop();
    } else {
      await this.play(this.audioId);
    }
  }

  isPlaying(): boolean {
    return this.audioRef ? !this.audioRef.paused : false;
  }

  //
  // Utils for seen
  //

  handleIntersect(entry) {
    if (entry.isIntersecting) {
      if (this.msg.to === this.current_user_id && this.msg.seen === false) {
        this.msg.seen = true;
        // Dispatch action to update message seen status
        this.store.dispatch(updateMessageSeenAction({ request: this.msg }));
      }
    }
  }

  //
  // Utils for time
  //

  messageTime(d: any) {
    if (!d) return null;
    return messageTime(d);
  }

  //
  // Utils for image preview
  //

  async openPreview(image) {
    console.log(image);
    const modal = await this.modalCtrl.create({
      component: PreviewPhotoComponent,
      componentProps: {
        photos: image,
      },
    });
    modal.present();
  }

  //
  // Utils for clipboard
  //
  writeToClipboard(text: string) {
    if (Capacitor.getPlatform() !== 'web') {
      Clipboard.write({
        string: text,
      })
        .then(() => {
          this.presentToast('Copied!');
        })
        .catch((e) => {
          console.error('Error copying text to clipboard', 'danger');
        });
    }
  }

  //
  // Reply
  //

  reply(msg: Message) {
    this.onReply.emit(msg);
    this.itemSlidingSender.close();
    this.itemSlidingReveiver.close();
  }

  //
  // Present Toast
  //

  async presentToast(msg: string, color?: string) {
    const toast = await this.toastController.create({
      message: msg,
      color: color || 'primary',
      duration: 300,
      position: 'top',
    });

    await toast.present();
  }
}
