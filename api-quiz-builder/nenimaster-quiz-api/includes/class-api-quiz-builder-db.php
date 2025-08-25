<?php
/**
 * The database functionality of the plugin.
 *
 * @link       https://nenimaster.com
 * @since      1.0.0
 *
 * @package    API_Quiz_Builder
 * @subpackage API_Quiz_Builder/includes
 */

/**
 * The database functionality of the plugin.
 *
 * This class defines all methods for interacting with the custom database table.
 *
 * @since      1.0.0
 * @package    API_Quiz_Builder
 * @subpackage API_Quiz_Builder/includes
 * @author     NeniMaster <contato@nenimaster.com>
 */
class API_Quiz_Builder_DB {

    /**
     * Create the custom database table on plugin activation.
     *
     * @since    1.0.0
     */
    public static function install() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'api_quizzes';
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE $table_name (
            id VARCHAR(36) NOT NULL PRIMARY KEY,
            title TEXT NOT NULL,
            description LONGTEXT NULL,
            slug VARCHAR(255) NOT NULL UNIQUE,
            status VARCHAR(50) NOT NULL DEFAULT 'draft',
            sessions LONGTEXT NULL,
            settings LONGTEXT NULL,
            design LONGTEXT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            last_synced_at DATETIME NOT NULL,
            INDEX (slug)
        ) $charset_collate;";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta( $sql );
    }

    /**
     * Insert or update a quiz in the custom database table.
     *
     * @since    1.0.0
     * @param    string $quiz_id
     * @param    string $title
     * @param    string $description
     * @param    string $slug
     * @param    string $status
     * @param    string $sessions_json
     * @param    string $settings_json
     * @param    string $design_json
     * @param    string $created_at
     * @param    string $updated_at
     * @param    string $last_synced_at
     * @return   bool True on success, false on failure.
     */
    public static function insert_or_update_quiz( $quiz_id, $title, $description, $slug, $status, $sessions_json, $settings_json, $design_json, $created_at, $updated_at, $last_synced_at ) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'api_quizzes';

        $existing_quiz = $wpdb->get_row( $wpdb->prepare( "SELECT id FROM $table_name WHERE id = %s", $quiz_id ) );

        $data = array(
            'title'          => $title,
            'description'    => $description,
            'slug'           => $slug,
            'status'         => $status,
            'sessions'       => $sessions_json,
            'settings'       => $settings_json,
            'design'         => $design_json,
            'updated_at'     => $updated_at,
            'last_synced_at' => $last_synced_at,
        );

        $format = array(
            '%s', // title
            '%s', // description
            '%s', // slug
            '%s', // status
            '%s', // sessions
            '%s', // settings
            '%s', // design
            '%s', // updated_at
            '%s', // last_synced_at
        );

        if ( $existing_quiz ) {
            // Update existing quiz
            $where = array( 'id' => $quiz_id );
            $where_format = array( '%s' );
            $result = $wpdb->update( $table_name, $data, $where, $format, $where_format );
        } else {
            // Insert new quiz
            $data['id'] = $quiz_id;
            $data['created_at'] = $created_at;
            array_unshift( $format, '%s', '%s' ); // Add format for id and created_at
            $result = $wpdb->insert( $table_name, $data, $format );
        }

        return false !== $result;
    }

    /**
     * Retrieve a quiz by its slug.
     *
     * @since    1.0.0
     * @param    string $slug The quiz slug.
     * @return   object|null The quiz object or null if not found.
     */
    public static function get_quiz_by_slug( $slug ) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'api_quizzes';
        return $wpdb->get_row( $wpdb->prepare( "SELECT * FROM $table_name WHERE slug = %s", $slug ) );
    }
}
?>