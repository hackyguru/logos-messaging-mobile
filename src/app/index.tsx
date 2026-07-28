import { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import {
  CONTENT_TOPIC,
  makeNick,
  nativeBackend,
  useChat,
  type ChatMessage,
  type WakuStatus,
} from '@/lib/use-chat';

// Fixed Logos-flavoured dark palette (matches Basecamp: charcoal + coral).
// The chat is branded, not theme-switched — identical on every device.
const C = {
  bg: '#141414',
  surface: '#1E1F22',
  surfaceHigh: '#2A2B2F',
  border: '#303236',
  coral: '#ED7B58',
  onCoral: '#241008',
  text: '#F5F5F5',
  textDim: '#9BA0A8',
  success: '#35C77F',
  warning: '#F5A623',
  error: '#E5533D',
} as const;

// Distinct accent per sender, stable across renders (and devices).
const NICK_COLORS = ['#6BD9A8', '#63B3ED', '#B794F4', '#F6C177', '#F28FAD', '#4FD1C5'];
function nickColor(nick: string): string {
  let h = 0;
  for (let i = 0; i < nick.length; i++) h = (h * 31 + nick.charCodeAt(i)) >>> 0;
  return NICK_COLORS[h % NICK_COLORS.length];
}

const STATUS_LABEL: Record<WakuStatus, string> = {
  starting: 'starting node…',
  'waiting-peers': 'joining mesh…',
  ready: 'online',
  error: 'error',
};

const STATUS_COLOR: Record<WakuStatus, string> = {
  starting: C.warning,
  'waiting-peers': C.warning,
  ready: C.success,
  error: C.error,
};

function fmtTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const mine = message.mine;
  return (
    <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
        {!mine && (
          <Text style={[styles.nick, { color: nickColor(message.nick) }]}>{message.nick}</Text>
        )}
        <View style={styles.bubbleBody}>
          <Text style={[styles.msgText, mine && styles.msgTextMine]}>{message.text}</Text>
          <Text style={[styles.time, mine ? styles.timeMine : styles.timeOther]}>
            {fmtTime(message.ts)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const nick = useMemo(makeNick, []);
  const { status, peerCount, error, messages, send } = useChat(nick);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const canSend = !sending && draft.trim().length > 0;

  const onSend = async () => {
    if (!canSend) return;
    setSending(true);
    try {
      const ok = await send(draft);
      if (ok) setDraft('');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Text style={styles.brand}>🪳 cockroach</Text>
              <View style={styles.statusPill}>
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[status] }]} />
                <Text style={styles.statusText}>
                  {STATUS_LABEL[status]}
                  {status === 'ready' && peerCount > 0 ? ` · ${peerCount} peer${peerCount === 1 ? '' : 's'}` : ''}
                </Text>
              </View>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>{nick}</Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipText}>
                  {nativeBackend ? 'logos.dev · full node' : 'waku sandbox · light'}
                </Text>
              </View>
              <View style={[styles.chip, styles.chipGrow]}>
                <Text style={styles.chipText} numberOfLines={1}>
                  {CONTENT_TOPIC}
                </Text>
              </View>
            </View>
          </View>

          {status === 'error' && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Messages */}
          <FlatList
            style={styles.flex}
            contentContainerStyle={styles.messageList}
            data={messages}
            inverted
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MessageBubble message={item} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyGlyph}>🪳</Text>
                <Text style={styles.emptyTitle}>
                  {status === 'ready' ? 'No messages yet' : 'Bringing your node up…'}
                </Text>
                <Text style={styles.emptySub}>
                  {status === 'ready'
                    ? nativeBackend
                      ? 'Say something — this phone is a full Logos node.'
                      : 'Say something — messages travel the Waku network.'
                    : 'Hang tight, joining the mesh.'}
                </Text>
              </View>
            }
          />

          {/* Composer */}
          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              placeholder="Message"
              placeholderTextColor={C.textDim}
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={onSend}
              returnKeyType="send"
              multiline={false}
            />
            <Pressable
              onPress={onSend}
              disabled={!canSend}
              hitSlop={8}
              style={({ pressed }) => [
                styles.sendButton,
                (!canSend || pressed) && styles.sendButtonDim,
              ]}
            >
              <Text style={styles.sendGlyph}>{sending ? '…' : '↑'}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  flex: {
    flex: 1,
  },

  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
    gap: Spacing.two,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    color: C.text,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.surface,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: C.text,
    fontSize: 12,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  chip: {
    backgroundColor: C.surface,
    borderRadius: 8,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
  },
  chipGrow: {
    flexShrink: 1,
  },
  chipText: {
    color: C.textDim,
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },

  errorBox: {
    margin: Spacing.three,
    padding: Spacing.three,
    borderRadius: 12,
    backgroundColor: 'rgba(229,83,61,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229,83,61,0.4)',
  },
  errorText: {
    color: C.error,
    fontSize: 13,
  },

  messageList: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: 6,
  },
  bubbleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  bubbleRowMine: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  bubbleOther: {
    backgroundColor: C.surfaceHigh,
    borderBottomLeftRadius: 6,
  },
  bubbleMine: {
    backgroundColor: C.coral,
    borderBottomRightRadius: 6,
  },
  nick: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  bubbleBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    columnGap: Spacing.two,
  },
  msgText: {
    color: C.text,
    fontSize: 16,
    lineHeight: 22,
    flexShrink: 1,
  },
  msgTextMine: {
    color: C.onCoral,
  },
  time: {
    fontSize: 10,
    marginBottom: 1,
  },
  timeOther: {
    color: C.textDim,
  },
  timeMine: {
    color: 'rgba(36,16,8,0.55)',
  },

  empty: {
    transform:
      Platform.OS === 'android' ? [{ scaleY: -1 }, { scaleX: -1 }] : [{ scaleY: -1 }],
    alignItems: 'center',
    padding: Spacing.six,
    gap: Spacing.two,
  },
  emptyGlyph: {
    fontSize: 44,
  },
  emptyTitle: {
    color: C.text,
    fontSize: 17,
    fontWeight: '700',
  },
  emptySub: {
    color: C.textDim,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },

  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginHorizontal: Spacing.three,
    marginBottom: BottomTabInset + Spacing.four,
    backgroundColor: C.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    paddingLeft: Spacing.three,
    paddingRight: 5,
    paddingVertical: 5,
  },
  input: {
    flex: 1,
    color: C.text,
    fontSize: 16,
    paddingVertical: Spacing.two,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDim: {
    opacity: 0.4,
  },
  sendGlyph: {
    color: C.onCoral,
    fontSize: 20,
    fontWeight: '700',
    marginTop: -2,
  },
});
