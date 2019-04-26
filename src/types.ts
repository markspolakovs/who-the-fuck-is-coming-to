export interface IEvent {
  owner: {
    name: string;
    uid: string;
  };
  name: string;
  options: IEventOptions;
}

export interface IEventOptions {
  private: boolean;
}

export const DefaultEventOptions: IEventOptions = {
  private: false
};

export interface IEventAttendee {
  uid: string;
  name: string;
  coming: boolean;
  note?: string;
}
