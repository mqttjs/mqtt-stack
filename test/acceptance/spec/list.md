# MQTT Spec Matrix

Taken from http://git.eclipse.org/c/paho/org.eclipse.paho.mqtt.testing.git/tree/interoperability/MQTT%20Tests.ods.

## Terminology

- [x] _SKIPPED_ **MQTT-1.1.0-1**:
  A Session can contain more than one Subscription. Each Subscription within a session MUST have a different Topic Filter.

- [x] _SKIPPED_ **MQTT-1.4.0-1**:
  The encoded data MUST be well-formed UTF-8 as defined by the Unicode spec and restated in RFC 3629. In particular the encoded data MUST NOT include encodings of code points between U+D800 and U+DFFF. If a receiver (Server or Client) receives a control packet containing ill-formed UTF-8 it MUST close the network connection.

- [x] _SKIPPED_ **MQTT-1.4.0-2**:
  The UTF-8 encoded string MUST NOT include an encoding of the null character U+0000. If a receiver (Server or Client) receives a control packet containing U+0000 it MUST close the network connection.

- [x] _SKIPPED_ **MQTT-1.4.0-3**:
  The UTF-8 encoded sequence 0xEF 0xBB 0xBF is always to be interpreted to mean U+FEFF ("ZERO WIDTH NO-BREAK SPACE") wherever it appears in a string and MUST NOT be skipped over or stripped off by a packet receiver.

## Control Packet Format

- [x] _TESTED_ **MQTT-2.0.0-1**:
  Unless stated otherwise, if either the Server or Client receives a Control Packet which does not meet this specification, it MUST close the Network Connection.

- [x] _SKIPPED_ **MQTT-2.1.2-1**:
  If invalid flags are received, the receiver MUST close the Network connection.

- [x] _SKIPPED_ **MQTT-2.1.2-2**:
  If Dup is 0 then the flow is the first occasion that the Client or Server has attempted to send the MQTT PUBLISH Packet. If Dup is 1 then this indicates that the flow might be re-delivery of an earlier packet.

- [x] _SKIPPED_ **MQTT-2.1.2-3**:
  The Dup flag MUST be set to 1 by the Client or Server when it attempts to re-deliver a PUBLISH Packet.

- [x] _SKIPPED_ **MQTT-2.1.2-4**:
  The Dup flag MUST be 0 for all QoS 0 messages

- [ ] **MQTT-2.1.2-5**:
  The value of the Dup flag from an incoming PUBLISH packet is not propagated when the PUBLISH Packet is sent to subscribers by the Server. The Dup flag in the outgoing PUBLISH packet MUST BE set independently to the incoming PUBLISH packet.

- [x] _TESTED_ **MQTT-2.1.2-6**:
  If the retain flag is set to 1, in a PUBLISH Packet sent by a Client to a Server, the Server MUST store the application message and its QoS, so that it can be delivered to future subscribers whose subscriptions match its topic name.

- [x] _TESTED_ **MQTT-2.1.2-7**:
  When a new subscription is established, the last retained message, if any, on each matching topic name MUST be sent to the subscriber.

- [x] _SKIPPED_ **MQTT-2.1.2-8**:
  If the Server receives a QoS 0 message with the RETAIN flag set to 1 it MUST discard any message previously retained for that topic. It SHOULD store the new QoS 0 message as the new retained message for that topic, but MAY discard it at any time. If this happens there will be no retained message for that topic.

- [x] _TESTED_ **MQTT-2.1.2-9**:
  When sending a PUBLISH Packet to a Client the Server MUST set the RETAIN flag to 1 if a message is sent as a result of a new subscription being made by a Client.

- [x] _TESTED_ **MQTT-2.1.2-10**:
  It MUST set the RETAIN flag to 0 when a PUBLISH Packet is sent to a Client because it matches an established subscription regardless of how the flag was set in the message it received

- [x] _TESTED_ **MQTT-2.1.2-11**:
  A PUBLISH Packet with a retain flag set to 1 and a payload containing zero bytes will be processed as normal by the Server and sent to Clients with a subscription matching the topic name. Additionally any existing retained message with the same topic name MUST be removed and any future subscribers for the topic will not receive a retained message.

- [x] _TESTED_ **MQTT-2.1.2-12**:
  If the RETAIN flag is 0, in a PUBLISH Packet sent by a Client to a Server, the Server MUST NOT store the message and MUST NOT remove or replace any existing retained message.

- [ ] **MQTT-2.3.1-1**:
  SUBSCRIBE, UNSUBSCRIBE, and PUBLISH (in cases where QoS > 0) Control Packets MUST contain a non-zero 16-bit Packet Identifier.

- [ ] **MQTT-2.3.1-4 MQTT-2.3.1-3**:
  The same conditions - apply to a Server when it sends a PUBLISH with QoS >0.

- [ ] **MQTT-2.3.1-5**:
  A PUBLISH Packet MUST NOT contain a Packet Identifier if its QoS value is set to 0.

- [ ] **MQTT-2.3.1-6**:
  A PUBACK, PUBREC, PUBREL Packet MUST contain the same Packet Identifier as the PUBLISH Packet that initiated the flow.

- [ ] **MQTT-2.3.1-7**:
  Similarly to MQTT-2.3.1-6 SUBACK and UNSUBACK MUST contain the Packet Identifier that was used in the corresponding SUBSCRIBE and UNSUBSCRIBE Packet respectively

## Control Packets

### Connect

- [x] _TESTED_ **MQTT-3.1.0-1**:
  After a Network Connection is established by a Client to a Server, the first flow from the Client to the Server MUST be a CONNECT Packet.

- [x] _TESTED_ **MQTT-3.1.0-2**:
  The Server MUST process a second CONNECT Packet sent from a Client as a protocol violation and disconnect the Client.

- [x] _TESTED_ **MQTT-3.1.2-1**:
  If the protocol name is incorrect the Server MAY disconnect the Client, or it MAY continue processing the CONNECT packet in accordance with some other specification. In the latter case, the Server MUST NOT continue to process the CONNECT packet in line with this specification

- [x] _SKIPPED_ **MQTT-3.1.2-2**:
  The Server MUST respond to the CONNECT Packet with a CONNACK return code 0x01 (unacceptable protocol level) and then disconnect the Client if the Protocol Level is not supported by the Server.

- [x] _SKIPPED_ **MQTT-3.1.2-3**:
  The Server MUST validate that the reserved flag in the CONNECT Control Packet is set to zero and disconnect the Client if it is not zero.

- [ ] **MQTT-3.1.2-4**:
  The Client and Server MUST store the Session after the Client and Server are disconnected.

- [ ] **MQTT-3.1.2-5**:
  After disconnection, the Server MUST store further QoS 1 and QoS 2 messages that match any subscriptions that the client had at the time of disconnection as part of the Session state.

- [ ] **MQTT-3.1.2-6**:
  If set to 1, the Client and Server MUST discard any previous Session and start a new one. This Session lasts as long as the Network Connection. State data associated with this session MUST NOT be reused in any subsequent Session

- [x] _SKIPPED_ **MQTT-3.1.2.7**:
  Retained publications do not form part of the Session state in the Server, they MUST NOT be deleted when the Session ends.

- [x] _TESTED_ **MQTT-3.1.2-8**:
  If the Will Flag is set to 1 this indicates that a Will Message MUST be published by the Server when the Server detects that the Client is disconnected for any reason other than the Client flowing a DISCONNECT Packet.

- [x] _SKIPPED_ **MQTT-3.1.2-9**:
  If the Will Flag is set to 1, the Will QoS and Will Retain fields in the Connect Flags will be used by the Server, and the Will Topic and Will Message fields MUST be present in the payload.

- [x] _TESTED_ **MQTT-3.1.2-10**:
  The will message MUST be removed from the stored Session state in the Server once it has been published or the Server has received a DISCONNECT packet from the Client. If the Will Flag is set to 0, no will message is published.

- [x] _SKIPPED_ **MQTT-3.1.2-11**:
  If the Will Flag is set to 0, then the Will QoS MUST be set to 0 (0x00).

- [x] _SKIPPED_ **MQTT-3.1.2-12**:
  If the Will Flag is set to 1, the value of Will QoS can be 0 (0x00), 1 (0x01), or 2 (0x02). It MUST NOT be 3 (0x03).

- [x] _SKIPPED_ **MQTT-3.1.2-13**:
  If the Will Flag is set to 0, then the Will Retain Flag MUST be set to 0.

- [x] _TESTED_ **MQTT-3.1.2-14**:
  If the Will Flag is set to 1 and If Will Retain is set to 0, the Server MUST publish the will message as a non-retained publication.

- [x] _TESTED_ **MQTT-3.1.2-15**:
  If the Will Flag is set to 1 and If Will Retain is set to 1, the Server MUST publish the will message as a retained publication.

- [x] _SKIPPED_ **MQTT-3.1.2-16**:
  If the User Name Flag is set to 0, a user name MUST NOT be present in the payload.

- [x] _SKIPPED_ **MQTT-3.1.2-17**:
  If the User Name Flag is set to 1, a user name MUST be present in the payload.

- [x] _SKIPPED_ **MQTT-3.1.2-18**:
  If the Password Flag is set to 0, a password MUST NOT be present in the payload.

- [x] _SKIPPED_ **MQTT-3.1.2-19**:
  If the Password Flag is set to 1, a password MUST be present in the payload.

- [x] _SKIPPED_ **MQTT-3.1.2-20**:
  If the User Name Flag is set to 0 then the Password Flag MUST be set to 0.

- [x] _TESTED_ **MQTT-3.1.2-22**:
  If the Server does not receive a Control Packet from the Client within one and a half times the Keep Alive time period, it MUST disconnect the Network Connection to the Client as if the network had failed.

- [x] _SKIPPED_ **MQTT-3.1.3-1**:
  These fields, if present, MUST appear in the order Client Identifier, Will Topic, Will Message, User Name, Password.

- [x] _SKIPPED_ **MQTT-3.1.3-2**:
  The ClientId MUST be used by Clients and by Servers to identify state that they hold relating to this MQTT connection between the Client and the Server

- [x] _SKIPPED_ **MQTT-3.1.3-3**:
  The Client Identifier (ClientId) MUST be present and MUST be the first field in the payload.

- [x] _TESTED_ **MQTT-3.1.3-4**:
  The ClientId MUST comprise only Unicode Unicode63 characters, and the length of the UTF-8 encoding MUST be at least zero bytes and no more than 65535 bytes.

- [x] _SKIPPED_ **MQTT-3.1.3-5**:
  The Server MUST allow ClientIds which are between 1 and 23 UTF-8 encoded bytes in length, and that contain only the characters
"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"

- [x] _TESTED_ **MQTT-3.1.3-6**:
  A Server MAY allow a Client to supply a ClientId that has a length of zero bytes. However if it does so the Server MUST treat this as a special case and assign a unique ClientId to that Client. It MUST then process the CONNECT packet as if the Client had provided that unique ClientId.

- [x] _TESTED_ **MQTT-3.1.3-7**:
  If the Client supplies a zero-byte ClientId, the Client MUST also set Clean Session to 1.

- [x] _TESTED_ **MQTT-3.1.3-8**:
  If the Client supplies a zero-byte ClientId with Clean Session set to 0, the Server MUST respond to the CONNECT Packet with a CONNACK return code 0x02 (Identifier rejected) and then close the Network Connection.

- [x] _SKIPPED_ **MQTT-3.1.3-9**:
  If the Server rejects the ClientId it MUST respond to the CONNECT Packet with a CONNACK return code 0x02 (Identifier rejected) and then close the Network Connection.

- [x] _SKIPPED_ **MQTT-3.1.4-1**:
  The Server MUST validate that the CONNECT Packet conforms to section and close the Network Connection without sending a CONNACK if it does not conform.

- [x] _TESTED_ **MQTT-3.1.4-2**:
  If the ClientId represents a Client already connected to the Server then the Server MUST disconnect the existing Client.

- [x] _SKIPPED_ **MQTT-3.1.4-3**:
  If the Server rejects the CONNECT, it MUST NOT process any data sent by the Client after the CONNECT Packet.

### Connack

- [x] _SKIPPED_ **MQTT-3.2.0-1**:
  The first packet sent from the Server to the Client MUST be a CONNACK Packet.

- [x] _SKIPPED_ **MQTT-3.2.2-1**:
  If a server sends a CONNACK packet containing a non-zero return code it MUST then close the Network Connection.

- [x] _SKIPPED_ **MQTT-3.2.2-2**:
  If none of these return codes are deemed applicable, then the Server MUST close the Network Connection without flowing a CONNACK.

### Publish

- [x] _SKIPPED_ **MQTT-3.3.2-1**:
  The Topic Name MUST be a UTF-8 encoded string.

- [x] _TESTED_ **MQTT-3.3.2-2**:
  The Topic Name in the PUBLISH Packet MUST NOT contain wildcard characters.

- [x] _SKIPPED_ **MQTT-3.3.2-3**:
  The Topic Name sent to a subscribing Client MUST match the Subscription’s Topic Filter.

- [x] _SKIPPED_ **MQTT-3.3.5-1**:
  The Server MUST deliver the message to the Client respecting the maximum QoS of all the matching subscriptions. In addition, the Server MAY deliver further copies of the message, one for each additional matching subscription and respecting the subscriptions QoS in each case.

- [x] _SKIPPED_ **MQTT-3.3.5-2**:
  If a Server implementation does not authorize a PUBLISH to be performed by a Client; it has no way of informing that Client. It MUST either make a positive acknowledgement, according to the normal QoS rules or disconnect the TCP session.

### Pubrec

- [ ] **MQTT-3.5.4-1**:
  When the sender of a PUBLISH Packet receives a PUBREC Packet, it MUST reply with a PUBREL Packet.

### Pubrel

- [x] _SKIPPED_ **MQTT-3.6.1-1**:
  Bits 3,2,1 and 0 of the fixed header in the PUBREL Control Packet are reserved and MUST be set to 0,0,1 and 0 respectively. The Server MUST treat any other value as malformed and close the Network Connection.

- [ ] **MQTT-3.6.4-1**:
  When the sender of a PUBREC Packet receives a PUBREL Packet it MUST reply with a PUBCOMP Packet.

### Subscribe

- [x] _SKIPPED_ **MQTT-3.8.1-1**:
  Bits 3,2,1 and 0 of the fixed header of the SUBSCRIBE Control Packet are reserved and MUST be set to 0,0,1 and 0 respectively. The Server MUST treat any other value as malformed and close the Network Connection.

- [x] _SKIPPED_ **MQTT-3.8.3-1**:
  The Payload of a SUBSCRIBE packet MUST contain at least one Topic Filter / QoS pair. A SUBSCRIBE packet with no payload is a protocol violation.

- [x] _SKIPPED_ **MQTT-3-8.3-2]**:
  The Server MUST treat a SUBSCRIBE packet as malformed and close the Network Connection if any of Reserved bits in the payload are non-zero.

- [x] _TESTED_ **MQTT-3.8.4-1**:
  When the Server receives a SUBSCRIBE Packet from a Client, the Server MUST respond with a SUBACK Packet.

- [x] _TESTED_ **MQTT-3.8.4-2**:
  The SUBACK Packet MUST have the same Packet Identifier as the SUBSCRIBE Packet.

- [ ] _PARTIAL_ **MQTT-3.8.4-3**:
  A subscribe request which contains a Topic Filter that is identical to an existing Subscription’s Topic Filter completely replaces that existing Subscription with a new Subscription. The Topic Filter in the new Subscription will be identical to that in the previous Subscription, although its maximum QoS value could be different. Any existing retained publications matching the Topic Filter are resent, but the flow of publications is not interrupted.

- [x] _SKIPPED_ **MQTT-3.8.4-4**:
  If a Server receives a SUBSCRIBE packet that contains multiple Topic Filters it MUST handle that packet as if it had received a sequence of multiple SUBSCRIBE packets, except that it combines their responses into a single SUBACK response.

- [x] _TESTED_ **MQTT-3.8.4-5**:
  The SUBACK Packet sent by the Server to the Client MUST contain a return code for each Topic Filter/QoS pair. This return code MUST either show the maximum QoS that was granted for that Subscription or indicate that the subscription failed.

- [ ] **MQTT-3.8.4-6**:
  The Server might grant a lower maximum QoS than the subscriber requested. The QoS of Payload Messages sent in response to a Subscription MUST be the minimum of the QoS of the originally published message and the maximum QoS granted by the Server. The server is permitted to send duplicate copies of a message to a subscriber in the case where the original message was published with QoS 1 and the maximum QoS granted was QoS 0.

## Suback

- [x] _TESTED_ **MQTT-3.9.3-1**:
  The order of return codes in the SUBACK Packet MUST match the order of Topic Filters in the SUBSCRIBE Packet.

- [x] _SKIPPED_ **MQTT-3.9.3-2**:
  SUBACK return codes other than 0x00, 0x01, 0x02 and 0x80 are reserved and MUST NOT be used.

### Unsubscribe

- [x] _SKIPPED_ **MQTT-3.10.1-1**:
  Bits 3,2,1 and 0 of the fixed header of the UNSUBSCRIBE Control Packet are reserved and MUST be set to 0,0,1 and 0 respectively. The Server MUST treat any other value as malformed and close the Network Connection.

- [x] _SKIPEPD_ **MQTT-3.10.3-1**:
  The Topic Filter (whether containing a wild-card or not) supplied in an UNSUBSCRIBE packet MUST be compared byte-for-byte with the current set of Topic Filters held by the Server for the Client. If any filter matches exactly then it is deleted, otherwise no additional processing occurs.

- [x] _TESTED_ **MQTT-3.10.3-2**:
  The Server sends an UNSUBACK Packet to the Client in response to an UNSUBSCRIBE Packet, The Server MUST stop adding any new messages for delivery to the Client.

- [ ] **MQTT-3.10.3-3**:
  The Server sends an UNSUBACK Packet to the Client in response to an UNSUBSCRIBE Packet, The Server MUST complete the delivery of any QoS 1 or QoS 2 messages which it has started to send to the Client.

- [x] _TESTED_ **MQTT-3.10.3-4**:
  The Server sends an UNSUBACK Packet to the Client in response to an UNSUBSCRIBE Packet, The Server MUST send an UNSUBACK packet. The UNSUBACK Packet MUST have the same Packet Identifier as the UNSUBSCRIBE Packet.

- [x] _TESTED_ **MQTT-3.10.3-5**:
  Even where no Topic Filters are deleted, the Server MUST respond with an UNSUBACK.

- [x] _SKIPPED_ **MQTT-3.10.3-6**:
  If a Server receives an UNSUBSCRIBE packet that contains multiple Topic Filters it MUST handle that packet as if it had received a sequence of multiple UNSUBSCRIBE packets, except that it sends just one UNSUBACK response.

### Pingreq

- [x] _TESTED_ **MQTT-3.12.4-1**:
  The Server MUST send a PINGRESP Packet in response to a PINGREQ packet.

### Disconnect

- [x] _SKIPPED_ **MQTT-3.14.1-1**:
  The Server MUST validate that reserved bits are set to zero in DISCONNECT Control Packet, and disconnect the Client if they are not zero.

- [x] _SKIPPED_ **MQTT-3.14.4-2**:
  After sending a DISCONNECT Packet the Client MUST NOT send any more Control Packets on that Network Connection.

- [x] _TESTED_ **MQTT-3.14.4-3**:
  On receipt of DISCONNECT the Server MUST discard the Will Message without publishing it.

## Operational Behaviour

- [ ] **MQTT-4.1.0-1**:
  The Client and Server MUST store data for at least as long as the Network Connection lasts.

- [x] _SKIPPED_ **MQTT-4.2.0-1**:
  The network connection used to transport the MQTT protocol MUST be an ordered, lossless, stream of bytes from the Client to Server and Server to Client.

- [ ] **MQTT-4.3.2-1**:
  The receiver of a QoS 1 PUBLISH Packet acknowledges receipt with a PUBACK Packet. If the Client reconnects and the Session is resumed, the sender MUST resend any in flight QoS 1 messages with the Dup flag set to 1.

- [ ] **MQTT-4.3.2-2**:
  The Server MUST store the message in accordance to its QoS properties and ensure onward delivery to applicable subscribers. (QoS 1)

- [ ] **MQTT-4.3.2-3**:
  When it receives a PUBLISH Packet with Dup set to 1 the receiver MUST perform the same actions as above which might result in a redelivery of the Application Message.

- [ ] **MQTT-4.3.3-1**:
  The receiver of a QoS 2 PUBLISH Packet acknowledges receipt with a PUBREC Packet. If the Client reconnects and the Session is resumed, the sender MUST resend any in-flight QoS 2 messages setting their Dup flags to 1.

- [ ] **MQTT-4.3.3-2**:
  The Server MUST store the message in accordance to its QoS properties and ensure onward delivery to applicable subscribers. (QoS 2)

- [ ] **MQTT-4.4.0-1**:
  When a Client reconnects with CleanSession = 0, both the Client and Server MUST redeliver any previous in-flight QoS 1 and QoS 2 messages. This means re-sending any unacknowledged PUBLISH Packets (where QoS > 0) and PUBREL Packets.

- [ ] **MQTT-4.4.0-2**:
  The PUBLISH packet MUST have the Dup flag set to 1 when it is redelivered.

- [ ] **MQTT-4.6.0-5**:
  A Server MUST by default treat each Topic as an "Ordered Topic". It MAY provide an administrative or other mechanism to allow one or more Topics to be treated as an "Unordered Topic".

- [ ] **MQTT-4.6.0-6**:
  When a Server processes a message that has been published to an Ordered Topic, it MUST follow the rules listed above when delivering messages to each of its subscribers. In addition it MUST send PUBLISH packets to consumers (for the same Topic and QoS) in the order that they were received from any given Client.

- [ ] **MQTT-4.7.1-1**:
  The wildcard characters can be used in Topic Filters, but MUST NOT be used within a Topic Name.

- [ ] **MQTT-4.7.1-2**:
  The multi-level wildcard character MUST be specified either on its own or following a topic level separator. In either case it MUST be the last character specified in the Topic Filter.

- [ ] **MQTT-4.7.1-3**:
  The single-level wildcard can be used at any level in the Topic Filter, including first and last levels. Where it is used it MUST occupy an entire level of the filter.

- [ ] **MQTT-4.7.3-1**:
  All Topic Names and Topic Filters MUST be at least one character long.

- [ ] **MQTT-4.7.3-2**:
  Topic Names and Topic Filters MUST NOT include the null character (Unicode U+0000).

- [ ] **MQTT-4.7.3-3**:
  Topic Names and Topic Filters are UTF-8 encoded strings, they MUST NOT encode to more than 65535 bytes.

- [ ] **MQTT-4.8.0-1**:
  If the Client or Server encounters a transient error while processing an inbound Control Packet it MUST close Network Connection which was used to send the packet.
