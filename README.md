# Real-Time Radio (RT-R)

Radio is one of the most widespread means of communication in the world, for several reasons: low cost, ease of use, simple components, freedom of configuration, and so on. But it also has drawbacks: a limited number of frequencies, the logistical cost of allocating frequencies, the risk of interference, and more. Common protocols such as Wi-Fi and Bluetooth solve these problems with a hub-like algorithm that "guesses" when each device can talk. The simplicity of the algorithm lets it work quickly, but it also leads to unpredictable situations such as stalls and errors, which must be corrected by algorithms in higher layers such as TCP.

My project is intended as an alternative to the existing Link Layer protocols, one that prioritizes accuracy over speed. RT-R is a communication protocol that defines a frequency on which every device in the network is able to talk, and then synchronizes the conversations between multiple devices on that same frequency so that no device interferes with the one whose turn it is to talk. The protocol will allow all conversations in the network to run over UDP without fear of failures at short ranges, and will also ensure greater accuracy for systems that use radio to take measurements.

## The project itself will include

- **Server** – Where users can register to the network and receive a unique code for their device. The server will notify the controller about the devices associated with the network, and will store personal details about the network's users for communication purposes.

- **Controller** – Notifies the other devices when it is their time to talk. The controller marks a number of frequencies as dedicated, and then floods the free frequencies with broadcasts of the association list between all devices and all frequencies. At the same time, the controller checks which of the dedicated frequencies are free and broadcasts on them the code of the device whose turn it is to talk.

- **Receiver** (one per frequency) – The receiver listens to a dedicated frequency, waits for the end-of-communication message, and updates the controller when the frequency is free. The receiver is connected directly to the controller, so if a frequency needs to be switched, it can do so without any dependence on the network. The receiver is also responsible for detecting faults on the frequency.

- **MITM** – A header file (`header.h`) that will be installed on the devices associated with the network and will translate regular radio calls into RT-R protocol calls. Devices that are not associated with a frequency will listen on a random frequency until they receive an association broadcast, and will occasionally switch to another random frequency to be safe. After association, the device will wait for a notification from the controller that it is its turn, perform one round of conversation, and then, if a fault occurred, report it to the receiver and return to the unassociated state. Otherwise, it will continue waiting for the next message from the controller.

## Auto Balancing

To avoid overloading a single frequency, the protocol supports Auto Balancing by tracking timeouts. A device that has not heard the controller within a certain period of time returns to the unassociated state, and the controller, which tracks conversation times, will know which devices did not get a response in time and will associate them with the most available dedicated frequency.

## Slave Releases

The `Slave Header Release` GitHub Action publishes a release for each changed
slave folder and syncs its tag-specific GitHub release API URL into
`headers.github_api`. Configure the repository Actions secrets
`SUPABASE_URL` and `SUPABASE_SECRET_KEY` for the sync. The workflow adds
rows with database-generated IDs, updates a folder's API URL when its latest
release changes, and removes rows for folders with no matching
`folder-vMAJOR.MINOR.PATCH` release. The database's foreign-key cascade handles
any related assignments.
