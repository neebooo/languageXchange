export enum ActionTypes {
  GET_MESSAGES_WITH_OFFSET = '[Message] Get Messages With Offset',
  GET_MESSAGES_WITH_OFFSET_SUCCESS = '[Message] Get Messages With Offset Success',
  GET_MESSAGES_WITH_OFFSET_FAILURE = '[Message] Get Messages With Offset Failure',

  CREATE_MESSAGE = '[Message] Create Message',
  CREATE_MESSAGE_SUCCESS = '[Message] Create Message Success',
  CREATE_MESSAGE_FAILURE = '[Message] Create Message Failure',

  ACTIVATE_ROOM = '[Message] Activate Room',
  DEACTIVATE_ROOM = '[Message] Deactivate Room',

  UPDATE_MESSAGE_SEEN = '[Message] Update Message Seen',
  UPDATE_MESSAGE_SEEN_SUCCESS = '[Message] Update Message Seen Success',
  UPDATE_MESSAGE_SEEN_FAILURE = '[Message] Update Message Seen Failure',

  REMOVE_MESSAGE_FROM_TEMP_MESSAGES = '[Message] Delete From Temp Messages',

  RESEND_MESSAGE_FROM_TEMP_MESSAGES = '[Message] Resend From Temp Messages',
  RESEND_MESSAGE_FROM_TEMP_MESSAGES_SUCCESS = '[Message] Resend From Temp Messages Success',
  RESEND_MESSAGE_FROM_TEMP_MESSAGES_FAILURE = '[Message] Resend From Temp Messages Failure',
}
