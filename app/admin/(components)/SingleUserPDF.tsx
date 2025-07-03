// app/dashboard/users/SingleUserPDF.tsx
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { UserType } from "./UsersPage";

type Props = { user: UserType };

const styles = StyleSheet.create({
  page: { padding: 20, fontSize: 10 },
  header: { fontSize: 18, marginBottom: 10, textAlign: "center" },
  section: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  paragraph: { marginBottom: 6, lineHeight: 1.4 },
  label: { fontSize: 12, marginBottom: 4, fontWeight: "bold" },

  table: { width: "100%", marginTop: 6 },
  tableRow: { flexDirection: "row" },
  tableColKey: { width: "40%", fontWeight: "bold", paddingVertical: 2 },
  tableColValue: { width: "60%", paddingVertical: 2 },

  vaultItem: { marginLeft: 10, marginTop: 2 },
});

const SingleUserPDF = ({ user }: Props) => {
  const totalBoxoban =
    user.boxoban.medium + user.boxoban.hard + user.boxoban.unfiltered;
  const totalLevels =
    user.endless + totalBoxoban + user.vaults + user.overclock.completedLevels;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Report Header */}
        <Text style={styles.header}>User Gameplay Report</Text>

        {/* Introduction / Summary */}
        <View style={styles.section}>
          <Text style={styles.paragraph}>
            This report provides a detailed breakdown of a player’s activity
            within the Sokoverse puzzle game. The metrics include progress in
            Endless Mode, Boxoban levels (categorized by difficulty), Spike
            Vault mode creations, and gameplay engagement. It is generated to
            assist in understanding player behavior and usage patterns for game
            analysis or administrative review.
          </Text>
          <Text style={styles.paragraph}>
            Below are the recorded details and statistics for the selected user.
          </Text>
        </View>

        {/* User Info Section */}
        <View style={styles.section}>
          <Text style={styles.label}>User Information</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableColKey}>User ID:</Text>
              <Text style={styles.tableColValue}>{user.id}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColKey}>Google ID:</Text>
              <Text style={styles.tableColValue}>{user.googleId}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColKey}>Account Type:</Text>
              <Text style={styles.tableColValue}>
                {user.isAnonymous ? "Guest" : "Google"}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColKey}>Joined At:</Text>
              <Text style={styles.tableColValue}>{user.createdAt}</Text>
            </View>
          </View>
        </View>

        {/* Game Stats Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Game Stats</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={styles.tableColKey}>Endless Levels:</Text>
              <Text style={styles.tableColValue}>{user.endless}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColKey}>Boxoban (Medium):</Text>
              <Text style={styles.tableColValue}>{user.boxoban.medium}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColKey}>Boxoban (Hard):</Text>
              <Text style={styles.tableColValue}>{user.boxoban.hard}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColKey}>Boxoban (Unfiltered):</Text>
              <Text style={styles.tableColValue}>
                {user.boxoban.unfiltered}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColKey}>Overclock (Current Level):</Text>
              <Text style={styles.tableColValue}>
                {user.overclock.currentLevel}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColKey}>Overclock (Completed):</Text>
              <Text style={styles.tableColValue}>
                {user.overclock.completedLevels}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColKey}>Vaults Played:</Text>
              <Text style={styles.tableColValue}>{user.vaults}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColKey}>Vaults Created:</Text>
              <Text style={styles.tableColValue}>
                {user.totalVaultsCreated}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableColKey}>Total Levels Played:</Text>
              <Text style={styles.tableColValue}>{totalLevels}</Text>
            </View>
          </View>
        </View>

        {/* Vault List Section */}
        {user.vaultsCreatedWithPlays.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Vaults Created</Text>
            {user.vaultsCreatedWithPlays.map((vault) => (
              <View key={vault.id} style={styles.vaultItem}>
                <Text>
                  - {vault.name} (Played {vault.timesPlayed} times)
                </Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};

export default SingleUserPDF;
