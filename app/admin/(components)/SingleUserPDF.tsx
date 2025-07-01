// app/dashboard/users/SingleUserPDF.tsx
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { UserType } from "./UsersPage";

type Props = { user: UserType };

const styles = StyleSheet.create({
  page: { padding: 20, fontSize: 10 },
  header: { fontSize: 18, marginBottom: 10, textAlign: "center" },
  section: { marginBottom: 12 },
  label: { fontWeight: "bold" },
  vaultItem: { marginLeft: 10, marginTop: 2 },
  paragraph: { marginBottom: 6, lineHeight: 1.4 },
});

const SingleUserPDF = ({ user }: Props) => {
  const totalBoxoban =
    user.boxoban.medium + user.boxoban.hard + user.boxoban.unfiltered;
  const totalLevels = user.endless + totalBoxoban + user.vaults;

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
          <Text>User ID: {user.id}</Text>
          <Text>Google ID: {user.googleId}</Text>
          <Text>Account Type: {user.isAnonymous ? "Guest" : "Google"}</Text>
          <Text>Joined At: {user.createdAt}</Text>
        </View>

        {/* Game Stats Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Game Stats</Text>
          <Text>- Endless Levels: {user.endless}</Text>
          <Text>
            - Boxoban: Medium {user.boxoban.medium}, Hard {user.boxoban.hard},
            Unfiltered {user.boxoban.unfiltered}
          </Text>
          <Text>- Vaults Played: {user.vaults}</Text>
          <Text>- Vaults Created: {user.totalVaultsCreated}</Text>
          <Text>- Total Levels Played: {totalLevels}</Text>
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
